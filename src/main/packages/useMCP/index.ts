import { Client } from "@modelcontextprotocol/sdk/client/index.js"

import { serializeError } from "serialize-error"
import {
  MCPStdioServerParam,
  MCPToolDetail,
  MCPCallToolResult,
  MCPListResourcesRequestParams,
  MCPListResourcesResponse,
  MCPListPromptsRequestParams,
  MCPListPromptsResponse,
  MCPListResourceTemplatesParams,
  MCPListResourceTemplatesResponse,
  MCPClientHandleCommand,
  MCPServerParam,
  isStdioServerParams,
  isStreamableServerParams,
  isSSEServerParams,
  MCPClientStatus,
  MCPRootTopicId,
} from "@shared/types/mcp"
import { BridgeResponse, responseData } from "@shared/types/bridge"
import { errorToText } from "@shared/error"
import { IpcChannel, MCPService } from "@shared/types/service"
import { ipcMain } from "electron"
import log from "electron-log"
import { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol"
import {
  availableClients,
  createClient,
  createSseTransport,
  createStdioTransport,
  createStreamableTransport,
  requestWithId,
  useMCPContext,
} from "./utils"
import { useToolCall, useToolName } from "@shared/mcp"
import { ServiceCore } from "@main/types"
import { ToolEnvironment } from "@shared/types/env"
import { defaultEnv } from "@shared/env"
import { cloneDeep } from "lodash"
export const name = "aichat-mcp-client"
export const version = "v0.0.1"
export default (): MCPService & ServiceCore => {
  let env: ToolEnvironment = defaultEnv()
  const cachedTools: Record<string, MCPToolDetail[]> = {}
  const toolName = useToolName()
  const toolCall = useToolCall()
  const { context, addContextRefCount, getContext, createContext, removeContext, getTopicReference, removeReference } =
    useMCPContext()

  async function registerServer(topicId: string, params: MCPServerParam): Promise<BridgeResponse<MCPClientStatus>> {
    const { id, serverName } = params
    let ctx = getContext(id)
    if (!ctx) ctx = createContext(params)
    try {
      if (ctx.client) {
        if (ctx.status === MCPClientStatus.Connecting) {
          return responseData(102, `connecting`, MCPClientStatus.Connecting)
        } else if (ctx.status === MCPClientStatus.Connected) {
          const pong = await ctx.client.ping()
          if (pong) {
            log.debug("[MCP registerServer]", `[${serverName}]already created`)
            addContextRefCount(topicId, id)
            return responseData(201, `[${serverName}]already created`, ctx.status)
          } else {
            log.debug("[MCP registerServer]", `[${serverName}]context found but client not connected`)
          }
        } else {
          ctx.reference.length = 0
        }
      }
      ctx.client = createClient(name, version)
      ctx.status = MCPClientStatus.Connecting
      if (isStdioServerParams(ctx.params)) {
        ctx.transport = await createStdioTransport(ctx.client, env, ctx.params)
        log.debug("[MCP register stdio server]", `[${serverName}]created`)
      } else if (isStreamableServerParams(ctx.params) || isSSEServerParams(ctx.params)) {
        try {
          ctx.transport = await createStreamableTransport(ctx.client, ctx.params)
          log.debug("[MCP register streamable server]", `[${serverName}]created`)
        } catch (_e) {
          log.warn("[MCP register streamable server error,attempt sse type]")
          ctx.transport = await createSseTransport(ctx.client, ctx.params)
          log.debug("[MCP register sse server]", `[${serverName}]created`)
        }
      } else {
        const err = `unknown server type:${params.type} in server ${serverName}`
        log.error("[MCP registerServer]", err, params)
        throw new Error(err)
      }
      ctx.status = MCPClientStatus.Connected
      if (!ctx.reference.includes(topicId)) {
        ctx.reference.push(topicId)
      }
      return responseData(200, "ok", ctx.status)
    } catch (error) {
      await removeContext(id)
      log.debug("[MCP registerServer error]", error)
      return responseData(500, errorToText(error), MCPClientStatus.Disconnected)
    }
  }
  async function toggleServer(
    topicId: string,
    id: string,
    command: MCPClientHandleCommand
  ): Promise<BridgeResponse<MCPClientStatus>> {
    try {
      const ctx = getContext(id)
      if (!ctx) {
        return responseData(404, `${id} not found`, MCPClientStatus.Disconnected)
      }
      switch (command.command) {
        case "start":
          return registerServer(topicId, ctx.params)
        case "stop": {
          removeReference(topicId, ctx.params.id)
          const refs = await getReference(ctx.params.id)
          if (refs.data.length === 0) {
            return toggleServer(topicId, id, { command: "delete" })
          } else if (refs.data.length == 1) {
            // 如果只剩下配置界面的引用，则删除该mcp服务
            // 用户再次到配置界面时再启动，节约资源
            if (refs.data[0] === MCPRootTopicId) {
              return toggleServer(topicId, id, { command: "delete" })
            }
          }
          return responseData(200, "ok", MCPClientStatus.Disconnected)
        }
        case "restart":
          await toggleServer(topicId, ctx.params.id, { command: "delete" })
          return toggleServer(topicId, ctx.params.id, { command: "start" })
        case "delete": {
          await removeContext(ctx.params.id)
          log.debug("[toggleServer delete]", `[${ctx.params.serverName}] stopped`)
          return responseData(200, "ok", MCPClientStatus.Disconnected)
        }
      }
    } catch (error) {
      log.error("[MCP toggleServer error]", error)
      return responseData(500, errorToText(error), MCPClientStatus.Disconnected)
    }
  }
  async function listTools(id?: string | Array<string>): Promise<BridgeResponse<MCPToolDetail[]>> {
    const results: MCPToolDetail[][] = []
    try {
      const clients = availableClients(context, id)
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
      const clients = availableClients(context, id)
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
      const clients = availableClients(context, id)
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
      const clients = availableClients(context, id)
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
        const ctx = context.get(serverId)
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
  function updateEnv(newEnv: ToolEnvironment) {
    env = cloneDeep(newEnv)
  }
  async function getReference(id: string): Promise<BridgeResponse<Array<string>>> {
    return responseData(200, "ok", getTopicReference(id))
  }
  function registerIpc() {
    ipcMain.handle(IpcChannel.McpRegisterServer, async (_, topicId: string, params: MCPStdioServerParam) => {
      return registerServer(topicId, params)
    })
    ipcMain.handle(
      IpcChannel.McpToggleServer,
      async (_, topicId: string, id: string, command: MCPClientHandleCommand) => {
        return toggleServer(topicId, id, command)
      }
    )
    ipcMain.handle(IpcChannel.McpListTools, async (_, id?: string | Array<string>) => {
      return listTools(id)
    })
    ipcMain.handle(IpcChannel.McpCallTool, async (_, name: string, args?: Record<string, unknown>) => {
      return callTool(name, args)
    })
    ipcMain.handle(IpcChannel.McpUpdateEnv, async (_, newEnv: ToolEnvironment) => {
      return updateEnv(newEnv)
    })
    ipcMain.handle(IpcChannel.McpGetReference, async (_, id: string) => {
      return getReference(id)
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
    context.forEach(ctx => {
      ctx.client?.close()
    })
    context.clear()
  }
  return {
    updateEnv,
    getReference,
    registerServer,
    toggleServer,
    listTools,
    callTool,
    listPrompts,
    listResources,
    listResourceTemplates,
    registerIpc,
    dispose,
  }
}
