import { Client } from "@modelcontextprotocol/sdk/client/index.js"

import { serializeError } from "serialize-error"
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
import { BridgeResponse, responseData } from "@shared/types/bridge"
import { errorToText } from "@shared/error"
import { EventBus, IpcChannel, MCPService } from "@shared/types/service"
import { ipcMain } from "electron"
import log from "electron-log"
import { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol"
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
import { useToolCall, useToolName } from "@shared/mcp"
import { ServiceCore } from "@main/types"
import { ToolEnvironment } from "@shared/types/env"
import { defaultEnv } from "@shared/env"
import { cloneDeep } from "lodash-es"
export const name = "aichat-mcp-client"
export const version = "v0.0.1"
export default (globalBus: EventBus): MCPService & ServiceCore => {
  let env: ToolEnvironment = defaultEnv()
  const cachedTools: Record<string, MCPToolDetail[]> = {}
  const toolName = useToolName()
  const toolCall = useToolCall()
  const context = useMCPContext()
  async function startServer(topicId: string, params: MCPServerParam): Promise<void> {
    const { id, name } = params
    let ctx = context.getContext(id)
    if (!ctx) ctx = context.createContext(getPureParam(params))
    context.addContextRef(id, topicId)
    try {
      if (ctx.client) {
        if (ctx.status === MCPClientStatus.Connecting) {
          emitStatus(globalBus, id, ctx.status, ctx.reference, 102, `connecting`)
          return
        } else if (ctx.status === MCPClientStatus.Connected) {
          const pong = await ctx.client.ping()
          if (pong) {
            log.debug("[MCP startServer]", `[${name}]already created`)
            emitStatus(globalBus, id, ctx.status, ctx.reference, 201, `[${name}]already created`)
            return
          } else {
            log.debug("[MCP startServer]", `[${name}]context found but client not connected`)
          }
        }
      }
      ctx.client = createClient(name, version)
      ctx.status = MCPClientStatus.Connecting
      emitStatus(globalBus, id, ctx.status, ctx.reference, 200, "connecting")
      if (isStdioServerParams(ctx.params)) {
        ctx.transport = await createStdioTransport(ctx.client, env, ctx.params)
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
      emitStatus(globalBus, id, ctx.status, ctx.reference, 200, "ok")
    } catch (error) {
      await context.removeContext(id)
      log.debug("[MCP startServer error]", error)
      emitStatus(globalBus, id, ctx.status, ctx.reference, 500, errorToText(error))
    }
  }
  async function stopServer(topicId: string, id: string): Promise<void> {
    try {
      const ctx = context.getContext(id)
      if (!ctx) {
        emitStatus(globalBus, id, MCPClientStatus.Disconnected, [], 404, `${id} not found`)
        return
      }
      if (topicId === MCPRootTopicId) {
        await context.removeContext(id)
        emitStatus(globalBus, ctx.params.id, MCPClientStatus.Disconnected, [], 200, "ok")
        return
      }
      context.removeReference(topicId, ctx.params.id)
      const refs = await getReferences(ctx.params.id)
      if (refs.data.length === 0 || (refs.data.length == 1 && refs.data[0] === MCPRootTopicId)) {
        // 如果只剩下配置界面的引用，则删除该mcp服务
        // 用户再次到配置界面时再启动，节约资源
        await context.removeContext(ctx.params.id)
        emitStatus(globalBus, ctx.params.id, MCPClientStatus.Disconnected, [], 200, "ok")
      } else {
        // 更新引用的refs
        emitStatus(globalBus, ctx.params.id, MCPClientStatus.Connected, refs.data, 200, "ok")
      }
    } catch (error) {
      log.error("[MCP stopServer error]", error)
    }
  }
  async function restartServer(topicId: string, id: string, params?: MCPServerParamCore): Promise<void> {
    try {
      const ctx = context.getContext(id)
      if (!ctx) {
        emitStatus(globalBus, id, MCPClientStatus.Disconnected, [], 404, `${id} not found`)
        return
      }
      await context.removeContext(ctx.params.id)
      emitStatus(globalBus, ctx.params.id, MCPClientStatus.Disconnected, [], 200, "removed")
      return startServer(topicId, {
        ...ctx.params,
        ...params,
        id,
      })
    } catch (error) {
      log.error("[MCP restartServer error]", error)
    }
  }

  async function listTools(id?: string | Array<string>): Promise<BridgeResponse<MCPToolDetail[]>> {
    const results: MCPToolDetail[][] = []
    try {
      const clients = availableClients(context.context, id)
      const filterClient: ReturnType<typeof availableClients> = []
      clients.forEach(client => {
        if (cachedTools[client.id]) {
          results.push(cachedTools[client.id])
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
              name: toolName.patch(tool.name, res.value.id),
            }))
            results.push(dst)
            cachedTools[res.value.id] = dst
            log.debug("[MCP listTools]", `${res.value.id} tools cached`)
          }
        })
      }
      return responseData(200, "ok", results.flat())
    } catch (error) {
      return responseData(500, JSON.stringify(serializeError(error)), [])
    }
  }
  async function listPrompts(
    id?: string | Array<string>,
    params?: MCPListPromptsRequestParams,
    options?: RequestOptions
  ): Promise<BridgeResponse<MCPListPromptsResponse>> {
    const results: MCPListPromptsResponse = { prompts: [] }
    try {
      const asyncReqs: Array<Promise<{ id: string; data: Awaited<ReturnType<Client["listPrompts"]>> }>> = []
      const clients = availableClients(context.context, id)
      for (const client of clients) {
        asyncReqs.push(requestWithId(client.id, () => client.client.listPrompts(params, options)))
      }
      const res = await Promise.allSettled(asyncReqs)
      res.forEach(r => {
        if (r.status === "fulfilled") {
          results.prompts.push(
            ...r.value.data.prompts.map(res => ({
              ...res,
              name: toolName.patch(res.name, r.value.id),
            }))
          )
        }
      })
      return responseData(200, "ok", results)
    } catch (error) {
      return responseData(500, JSON.stringify(serializeError(error)), results)
    }
  }
  async function listResources(
    id?: string | Array<string>,
    params?: MCPListResourcesRequestParams,
    options?: RequestOptions
  ): Promise<BridgeResponse<MCPListResourcesResponse>> {
    const results: MCPListResourcesResponse = { resources: [] }
    try {
      const asyncReqs: Array<Promise<{ id: string; data: Awaited<ReturnType<Client["listResources"]>> }>> = []
      const clients = availableClients(context.context, id)
      for (const client of clients) {
        asyncReqs.push(requestWithId(client.id, () => client.client.listResources(params, options)))
      }
      const res = await Promise.allSettled(asyncReqs)
      res.forEach(r => {
        if (r.status === "fulfilled") {
          results.resources.push(
            ...r.value.data.resources.map(res => ({
              ...res,
              name: toolName.patch(res.name, r.value.id),
            }))
          )
        }
      })
      return responseData(200, "ok", results)
    } catch (error) {
      return responseData(500, JSON.stringify(serializeError(error)), results)
    }
  }
  async function listResourceTemplates(
    id?: string | Array<string>,
    params?: MCPListResourceTemplatesParams,
    options?: RequestOptions
  ): Promise<BridgeResponse<MCPListResourceTemplatesResponse>> {
    const results: MCPListResourceTemplatesResponse = { resourceTemplates: [] }
    try {
      const asyncReqs: Array<Promise<{ id: string; data: Awaited<ReturnType<Client["listResourceTemplates"]>> }>> = []
      const clients = availableClients(context.context, id)
      for (const client of clients) {
        asyncReqs.push(requestWithId(client.id, () => client.client.listResourceTemplates(params, options)))
      }
      const res = await Promise.allSettled(asyncReqs)
      res.forEach(r => {
        if (r.status === "fulfilled") {
          results.resourceTemplates.push(
            ...r.value.data.resourceTemplates.map(res => ({
              ...res,
              name: toolName.patch(res.name, r.value.id),
            }))
          )
        }
      })
      return responseData(200, "ok", results)
    } catch (error) {
      return responseData(500, JSON.stringify(serializeError(error)), results)
    }
  }
  async function callTool(
    toolname: string,
    args?: Record<string, unknown>
  ): Promise<BridgeResponse<MCPCallToolResult>> {
    try {
      const tools = await listTools()
      const tool = tools.data.find(tool => tool.name === toolname)
      if (tool) {
        const { serverId, name } = toolName.split(tool.name)
        const ctx = context.getContext(serverId)
        if (!ctx) {
          const msg = `server [${serverId}] not found`
          return responseData(500, msg, { content: { type: "text", text: msg } })
        }
        const [validArgs, validErrors] = toolCall.validate(tool, args)
        if (!validArgs) {
          return responseData(200, "args vailid error", {
            content: { type: "text", text: JSON.stringify(validErrors ?? []) },
          })
        }
        if (ctx.status === MCPClientStatus.Connected && ctx.client) {
          const res = (await ctx.client.callTool({
            name,
            arguments: args,
          })) as MCPCallToolResult
          return responseData(200, "ok", res)
        }
        throw new Error(`server [${serverId}] not connected or client not found`)
      } else {
        const msg = `tool [${name}] not found`
        return responseData(404, msg, { content: { type: "text", text: msg } })
      }
    } catch (error) {
      const errorText = errorToText(error)
      return responseData(500, errorText, { content: { type: "text", text: errorText } })
    }
  }
  async function updateEnv(newEnv: ToolEnvironment) {
    env = cloneDeep(newEnv)
  }
  async function getReferences(id: string): Promise<BridgeResponse<Array<string>>> {
    return responseData(200, "ok", context.getTopicReference(id))
  }
  async function getTopicServers(topicId: string): Promise<BridgeResponse<Array<string>>> {
    return responseData(200, "ok", context.getServersByTopic(topicId))
  }
  async function stopTopicServers(topicId: string): Promise<BridgeResponse<number>> {
    const servers = await getTopicServers(topicId)
    const asyncReqs = servers.data.map(serverId => stopServer(topicId, serverId))
    const res = await Promise.allSettled(asyncReqs)
    return responseData(200, "ok", res.filter(r => r.status === "fulfilled").length)
  }
  async function hasReference(id: string, topicId: string): Promise<BridgeResponse<boolean>> {
    return responseData(200, "ok", context.hasTopicReference(id, topicId))
  }
  function registerIpc() {
    ipcMain.handle(IpcChannel.McpStartServer, async (_, topicId: string, params: MCPServerParam) => {
      return startServer(topicId, params)
    })
    ipcMain.handle(IpcChannel.McpStopServer, async (_, topicId: string, id: string) => {
      return stopServer(topicId, id)
    })
    ipcMain.handle(IpcChannel.McpRestartServer, async (_, topicId: string, id: string, params?: MCPServerParamCore) => {
      return restartServer(topicId, id, params)
    })
    ipcMain.handle(IpcChannel.McpListTools, async (_, id?: string | Array<string>) => {
      return listTools(id)
    })
    ipcMain.handle(IpcChannel.McpCallTool, async (_, name: string, args?: Record<string, unknown>) => {
      return callTool(name, args)
    })
    ipcMain.handle(IpcChannel.McpUpdateEnv, async (_, newEnv: ToolEnvironment) => {
      return updateEnv(newEnv)
    })
    ipcMain.handle(IpcChannel.McpGetReferences, async (_, id: string) => {
      return getReferences(id)
    })
    ipcMain.handle(IpcChannel.McpGetTopicServers, async (_, topicId: string) => {
      return getTopicServers(topicId)
    })
    ipcMain.handle(IpcChannel.McpStopTopicServers, async (_, topicId: string) => {
      return stopTopicServers(topicId)
    })
    ipcMain.handle(IpcChannel.McpHasReference, async (_, id: string, topicId: string) => {
      return hasReference(id, topicId)
    })
    ipcMain.handle(
      IpcChannel.McpListPrompts,
      async (_, id?: string | Array<string>, params?: MCPListPromptsRequestParams, options?: RequestOptions) => {
        return listPrompts(id, params, options)
      }
    )
    ipcMain.handle(
      IpcChannel.McpListResources,
      async (_, id?: string | Array<string>, params?: MCPListResourcesRequestParams, options?: RequestOptions) => {
        return listResources(id, params, options)
      }
    )
    ipcMain.handle(
      IpcChannel.McpListResourceTemplates,
      async (_, id?: string | Array<string>, params?: MCPListResourceTemplatesParams, options?: RequestOptions) => {
        return listResourceTemplates(id, params, options)
      }
    )
  }
  function dispose() {
    context.dispose()
  }
  return {
    updateEnv,
    getReferences,
    getTopicServers,
    stopTopicServers,
    hasReference,
    startServer,
    stopServer,
    restartServer,
    listTools,
    callTool,
    listPrompts,
    listResources,
    listResourceTemplates,
    registerIpc,
    dispose,
  }
}
