import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import {
  MCPToolDetail,
  MCPCallToolResult,
  MCPListResourcesRequestParams,
  MCPListResourcesResponse,
  MCPListPromptsRequestParams,
  MCPListPromptsResponse,
  MCPListResourceTemplatesParams,
  MCPListResourceTemplatesResponse,
  MCPServerParam,
  isStdioServerParams,
  isStreamableServerParams,
  isSSEServerParams,
  MCPClientStatus,
  MCPRootTopicId,
  getPureParam,
  MCPServerParamCore,
} from "@shared/types/mcp"
import { errorToText, Response, responseData } from "@toolmain/shared"
import { EventBus, IpcChannel, MCPService } from "@shared/service"
import { ipcMain } from "electron"
import log from "electron-log"
import { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js"
import {
  availableClients,
  createClient,
  createSseTransport,
  createStdioTransport,
  createStreamableTransport,
  emitStatus,
  requestWithId,
  useMCPContext,
} from "./utils"
import { useToolCall } from "@shared/mcp"
import { ServiceCore } from "@main/types"
import { ToolEnvironment, ToolEnvTestResult } from "@shared/types/env"
import { defaultEnv } from "@shared/env"
import { mcpEnv } from "./env"

export const mcpName = "windflow-mcp-client"
export const mcpVersion = "v0.0.1"
export class MCPServiceImpl implements MCPService, ServiceCore {
  #globalBus: EventBus
  #envParams: ToolEnvironment = defaultEnv()
  #env = mcpEnv()
  #cachedTools: Record<string, MCPToolDetail[]> = {}
  #toolCall = useToolCall()
  #context = useMCPContext()
  constructor(globalBus: EventBus) {
    this.#globalBus = globalBus
  }
  async startServer(topicId: string, params: MCPServerParam): Promise<void> {
    const { id, name } = params
    let ctx = this.#context.getContext(id)
    if (!ctx) ctx = this.#context.createContext(getPureParam(params))
    this.#context.addContextRef(id, topicId)
    try {
      if (ctx.client) {
        if (ctx.status === MCPClientStatus.Connecting) {
          emitStatus(this.#globalBus, id, name, ctx.status, ctx.reference, 102, `connecting`)
          return
        } else if (ctx.status === MCPClientStatus.Connected) {
          const pong = await ctx.client.ping()
          if (pong) {
            log.debug("[MCP startServer]", `[${name}]already created`)
            emitStatus(this.#globalBus, id, name, ctx.status, ctx.reference, 201, `[${name}]already created`)
            return
          } else {
            log.debug("[MCP startServer]", `[${name}]context found but client not connected`)
          }
        }
      }
      ctx.client = createClient(mcpName, mcpVersion)
      ctx.status = MCPClientStatus.Connecting
      emitStatus(this.#globalBus, id, name, ctx.status, ctx.reference, 200, "connecting")
      if (isStdioServerParams(ctx.params)) {
        ctx.transport = await createStdioTransport(ctx.client, this.#envParams, ctx.params)
        log.debug("[MCP register stdio server]", `[${name}]created`)
      } else if (isStreamableServerParams(ctx.params) || isSSEServerParams(ctx.params)) {
        try {
          ctx.transport = await createStreamableTransport(ctx.client, ctx.params)
          log.debug("[MCP register streamable server]", `[${name}]created`)
        } catch (_e) {
          log.warn("[MCP register streamable server error,attempt sse type]")
          ctx.transport = await createSseTransport(ctx.client, ctx.params)
          log.debug("[MCP register sse server]", `[${name}]created`)
        }
      } else {
        const err = `unknown server type:${params.type} in server ${name}`
        log.error("[MCP startServer]", err, params)
        throw new Error(err)
      }
      ctx.status = MCPClientStatus.Connected
      emitStatus(this.#globalBus, id, name, ctx.status, ctx.reference, 200, "ok")
    } catch (error) {
      await this.#context.removeContext(id)
      log.debug("[MCP startServer error]", error)
      emitStatus(this.#globalBus, id, name, MCPClientStatus.Disconnected, [], 500, errorToText(error))
    }
  }
  async stopServer(topicId: string, id: string): Promise<void> {
    try {
      const ctx = this.#context.getContext(id)
      if (!ctx) {
        emitStatus(this.#globalBus, id, "", MCPClientStatus.Disconnected, [], 404, `${id} not found`)
        return
      }
      if (topicId === MCPRootTopicId) {
        await this.#context.removeContext(id)
        emitStatus(this.#globalBus, ctx.params.id, ctx.params.name, MCPClientStatus.Disconnected, [], 200, "ok")
        return
      }
      this.#context.removeReference(topicId, ctx.params.id)
      const refs = await this.getReferences(ctx.params.id)
      if (refs.data.length === 0 || (refs.data.length == 1 && refs.data[0] === MCPRootTopicId)) {
        // 如果只剩下配置界面的引用，则删除该mcp服务
        // 用户再次到配置界面时再启动，节约资源
        await this.#context.removeContext(ctx.params.id)
        emitStatus(this.#globalBus, ctx.params.id, ctx.params.name, MCPClientStatus.Disconnected, [], 200, "ok")
      } else {
        // 更新引用的refs
        emitStatus(this.#globalBus, ctx.params.id, ctx.params.name, MCPClientStatus.Connected, refs.data, 200, "ok")
      }
    } catch (error) {
      log.error("[MCP stopServer error]", error)
    }
  }
  async restartServer(topicId: string, id: string, params?: MCPServerParamCore): Promise<void> {
    try {
      const ctx = this.#context.getContext(id)
      if (!ctx) {
        emitStatus(this.#globalBus, id, "", MCPClientStatus.Disconnected, [], 404, `${id} not found`)
        return
      }
      await this.#context.removeContext(ctx.params.id)
      emitStatus(this.#globalBus, ctx.params.id, ctx.params.name, MCPClientStatus.Disconnected, [], 200, "removed")
      return this.startServer(topicId, {
        ...ctx.params,
        ...params,
        id,
      })
    } catch (error) {
      log.error("[MCP restartServer error]", error)
    }
  }

  async listTools(id?: string | Array<string>): Promise<Response<MCPToolDetail[]>> {
    const results: MCPToolDetail[][] = []
    try {
      const clients = availableClients(this.#context.context, id)
      const filterClient: ReturnType<typeof availableClients> = []
      clients.forEach(client => {
        if (this.#cachedTools[client.id]) {
          results.push(this.#cachedTools[client.id])
        } else {
          filterClient.push(client)
        }
      })
      const asyncReqs: Array<Promise<{ id: string; data: Awaited<ReturnType<Client["listTools"]>> }>> = []
      for (const client of filterClient) {
        asyncReqs.push(requestWithId(client.id, () => client.client.listTools()))
      }
      if (asyncReqs.length > 0) {
        const res = await Promise.allSettled(asyncReqs)
        res.forEach(res => {
          if (res.status === "fulfilled") {
            const dst = res.value.data.tools.map<MCPToolDetail>(tool => ({
              ...tool,
              serverId: res.value.id,
            }))
            results.push(dst)
            this.#cachedTools[res.value.id] = dst
            log.debug("[MCP listTools]", `[${this.#context.getContext(res.value.id)?.params.name ?? ""}] cached`)
          }
        })
      }
      return responseData(200, "ok", results.flat())
    } catch (error) {
      return responseData(500, errorToText(error), [])
    }
  }
  async listPrompts(
    id?: string | Array<string>,
    params?: MCPListPromptsRequestParams,
    options?: RequestOptions
  ): Promise<Response<MCPListPromptsResponse>> {
    const results: MCPListPromptsResponse = { prompts: [] }
    try {
      const asyncReqs: Array<Promise<{ id: string; data: Awaited<ReturnType<Client["listPrompts"]>> }>> = []
      const clients = availableClients(this.#context.context, id)
      for (const client of clients) {
        asyncReqs.push(requestWithId(client.id, () => client.client.listPrompts(params, options)))
      }
      const res = await Promise.allSettled(asyncReqs)
      res.forEach(r => {
        if (r.status === "fulfilled") {
          results.prompts.push(
            ...r.value.data.prompts.map(res => ({
              ...res,
              serverId: r.value.id,
            }))
          )
        }
      })
      return responseData(200, "ok", results)
    } catch (error) {
      return responseData(500, errorToText(error), results)
    }
  }
  async listResources(
    id?: string | Array<string>,
    params?: MCPListResourcesRequestParams,
    options?: RequestOptions
  ): Promise<Response<MCPListResourcesResponse>> {
    const results: MCPListResourcesResponse = { resources: [] }
    try {
      const asyncReqs: Array<Promise<{ id: string; data: Awaited<ReturnType<Client["listResources"]>> }>> = []
      const clients = availableClients(this.#context.context, id)
      for (const client of clients) {
        asyncReqs.push(requestWithId(client.id, () => client.client.listResources(params, options)))
      }
      const res = await Promise.allSettled(asyncReqs)
      res.forEach(r => {
        if (r.status === "fulfilled") {
          results.resources.push(
            ...r.value.data.resources.map(res => ({
              ...res,
              serverId: r.value.id,
            }))
          )
        }
      })
      return responseData(200, "ok", results)
    } catch (error) {
      return responseData(500, errorToText(error), results)
    }
  }
  async listResourceTemplates(
    id?: string | Array<string>,
    params?: MCPListResourceTemplatesParams,
    options?: RequestOptions
  ): Promise<Response<MCPListResourceTemplatesResponse>> {
    const results: MCPListResourceTemplatesResponse = { resourceTemplates: [] }
    try {
      const asyncReqs: Array<Promise<{ id: string; data: Awaited<ReturnType<Client["listResourceTemplates"]>> }>> = []
      const clients = availableClients(this.#context.context, id)
      for (const client of clients) {
        asyncReqs.push(requestWithId(client.id, () => client.client.listResourceTemplates(params, options)))
      }
      const res = await Promise.allSettled(asyncReqs)
      res.forEach(r => {
        if (r.status === "fulfilled") {
          results.resourceTemplates.push(
            ...r.value.data.resourceTemplates.map(res => ({
              ...res,
              serverId: r.value.id,
            }))
          )
        }
      })
      return responseData(200, "ok", results)
    } catch (error) {
      return responseData(500, errorToText(error), results)
    }
  }
  async callTool(id: string, toolname: string, args?: Record<string, unknown>): Promise<Response<MCPCallToolResult>> {
    try {
      const tools = await this.listTools(id)
      const tool = tools.data.find(tool => tool.name === toolname)
      if (tool) {
        const ctx = this.#context.getContext(id)
        if (!ctx) {
          const msg = `server [${id}] not found`
          return responseData(500, msg, { content: { type: "text", text: msg } })
        }
        const [validArgs, validErrors] = this.#toolCall.validate(tool, args)
        if (!validArgs) {
          return responseData(200, "args vailid error", {
            content: { type: "text", text: errorToText(validErrors) },
          })
        }
        if (ctx.status === MCPClientStatus.Connected && ctx.client) {
          const res = (await ctx.client.callTool({
            name: toolname,
            arguments: args,
          })) as MCPCallToolResult
          log.debug(`[calltool] [${toolname}]`)
          return responseData(200, "ok", res)
        }
        throw new Error(`server [${id}] not connected or client not found`)
      } else {
        const msg = `tool [${toolname}] not found`
        return responseData(404, msg, { content: { type: "text", text: msg } })
      }
    } catch (error) {
      const errorText = errorToText(error)
      return responseData(500, errorText, { content: { type: "text", text: errorText } })
    }
  }
  async updateEnv(newEnv: ToolEnvironment) {
    this.#envParams = newEnv
  }
  async getReferences(id: string): Promise<Response<Array<string>>> {
    return responseData(200, "ok", this.#context.getTopicReference(id))
  }
  async getTopicServers(topicId: string): Promise<Response<Array<string>>> {
    return responseData(200, "ok", this.#context.getServersByTopic(topicId))
  }
  async stopTopicServers(topicId: string): Promise<Response<number>> {
    const servers = await this.getTopicServers(topicId)
    const asyncReqs = servers.data.map(serverId => this.stopServer(topicId, serverId))
    const res = await Promise.allSettled(asyncReqs)
    return responseData(200, "ok", res.filter(r => r.status === "fulfilled").length)
  }
  async hasReference(id: string, topicId: string): Promise<Response<boolean>> {
    return responseData(200, "ok", this.#context.hasTopicReference(id, topicId))
  }
  async testEnv(args: ToolEnvironment): Promise<Response<ToolEnvTestResult>> {
    return this.#env.testEnv(args)
  }
  registerIpc() {
    ipcMain.handle(IpcChannel.McpStartServer, async (_, topicId: string, params: MCPServerParam) => {
      return this.startServer(topicId, params)
    })
    ipcMain.handle(IpcChannel.McpStopServer, async (_, topicId: string, id: string) => {
      return this.stopServer(topicId, id)
    })
    ipcMain.handle(IpcChannel.McpRestartServer, async (_, topicId: string, id: string, params?: MCPServerParamCore) => {
      return this.restartServer(topicId, id, params)
    })
    ipcMain.handle(IpcChannel.McpListTools, async (_, id?: string | Array<string>) => {
      return this.listTools(id)
    })
    ipcMain.handle(IpcChannel.McpCallTool, async (_, id: string, name: string, args?: Record<string, unknown>) => {
      return this.callTool(id, name, args)
    })
    ipcMain.handle(IpcChannel.McpUpdateEnv, async (_, newEnv: ToolEnvironment) => {
      return this.updateEnv(newEnv)
    })
    ipcMain.handle(IpcChannel.McpGetReferences, async (_, id: string) => {
      return this.getReferences(id)
    })
    ipcMain.handle(IpcChannel.McpGetTopicServers, async (_, topicId: string) => {
      return this.getTopicServers(topicId)
    })
    ipcMain.handle(IpcChannel.McpStopTopicServers, async (_, topicId: string) => {
      return this.stopTopicServers(topicId)
    })
    ipcMain.handle(IpcChannel.McpHasReference, async (_, id: string, topicId: string) => {
      return this.hasReference(id, topicId)
    })
    ipcMain.handle(
      IpcChannel.McpListPrompts,
      async (_, id?: string | Array<string>, params?: MCPListPromptsRequestParams, options?: RequestOptions) => {
        return this.listPrompts(id, params, options)
      }
    )
    ipcMain.handle(
      IpcChannel.McpListResources,
      async (_, id?: string | Array<string>, params?: MCPListResourcesRequestParams, options?: RequestOptions) => {
        return this.listResources(id, params, options)
      }
    )
    ipcMain.handle(
      IpcChannel.McpListResourceTemplates,
      async (_, id?: string | Array<string>, params?: MCPListResourceTemplatesParams, options?: RequestOptions) => {
        return this.listResourceTemplates(id, params, options)
      }
    )
    // --- env
    ipcMain.handle(IpcChannel.McpTestEnv, async (_, args: ToolEnvironment) => {
      return this.testEnv(args)
    })
  }
  dispose() {
    this.#context.dispose()
  }
}
