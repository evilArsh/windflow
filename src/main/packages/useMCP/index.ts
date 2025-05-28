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
  isAvailableServerParams,
  isStdioServerParams,
  isStreamableServerParams,
  isSSEServerParams,
} from "@shared/types/mcp"
import { BridgeResponse, BridgeStatusResponse, code2xx, responseCode, responseData } from "@shared/types/bridge"
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
} from "./utils"
import { MCPClientContext } from "./types"
import { useToolCall, useToolName } from "@shared/mcp"
import { ServiceCore } from "@main/types"
export const name = "aichat-mcp-client"
export const version = "v0.0.1"
export default (): MCPService & ServiceCore => {
  const context = new Map<string, MCPClientContext>()
  const cachedTools: Record<string, MCPToolDetail[]> = {}
  const toolName = useToolName()
  const toolCall = useToolCall()
  async function registerServer(params: MCPServerParam): Promise<BridgeStatusResponse> {
    try {
      if (!isAvailableServerParams(params)) {
        log.error("[MCP registerServer]", "Invalid server params", params)
      }
      const { id, serverName } = params
      let ctx = context.get(id)
      if (!ctx) {
        ctx = { params }
        log.debug("[MCP registerServer]", `[${serverName}]context not found create new one`)
      } else {
        if (ctx.client) {
          const pong = await ctx.client.ping()
          if (pong) {
            log.debug("[MCP registerServer]", `[${serverName}]already created`)
            return responseCode(201, `[${serverName}]already created`)
          } else {
            log.debug("[MCP registerServer]", `[${serverName}]context found but client not connected`)
          }
        } else {
          log.debug("[MCP registerServer]", `[${serverName}]context found but client not created`)
        }
      }
      const client = createClient(name, version)
      if (isStdioServerParams(ctx.params)) {
        ctx.transport = await createStdioTransport(client, ctx.params)
        log.debug("[MCP register stdio server]", `[${serverName}]created`)
      } else if (isStreamableServerParams(ctx.params) || isSSEServerParams(ctx.params)) {
        try {
          ctx.transport = await createStreamableTransport(client, ctx.params)
          log.debug("[MCP register streamable server]", `[${serverName}]created`)
        } catch (_e) {
          log.warn("[MCP register streamable server error,attempt sse type]")
          ctx.transport = await createSseTransport(client, ctx.params)
          log.debug("[MCP register sse server]", `[${serverName}]created`)
        }
      } else {
        const err = `unknown server type:${params.type} in server ${serverName}`
        log.error("[MCP registerServer]", err, params)
        throw new Error(err)
      }
      ctx.client = client
      context.set(id, ctx)
      return responseCode(200)
    } catch (error) {
      console.log(error)
      return responseCode(500, JSON.stringify(serializeError(error)))
    }
  }
  async function toggleServer(id: string, command: MCPClientHandleCommand): Promise<BridgeStatusResponse> {
    const ctx = context.get(id)
    if (!ctx) {
      return responseCode(404, `${id} not found`)
    }
    switch (command.command) {
      case "start":
        return registerServer(ctx.params)
      case "stop":
        if (ctx.client) {
          await ctx.client.close()
          ctx.client = undefined
        }
        return responseCode(200, "ok")
      case "restart":
        await toggleServer(id, { command: "stop" })
        return toggleServer(id, { command: "start" })
      case "delete": {
        const res = await toggleServer(id, { command: "stop" })
        if (code2xx(res.code)) {
          context.delete(id)
        }
        return res
      }
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
        let ctx = context.get(serverId)
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
        const res = await registerServer(ctx.params)
        if (code2xx(res.code)) {
          ctx = context.get(serverId)!
          const res = (await ctx.client!.callTool({
            name,
            arguments: args,
          })) as MCPCallToolResult
          return responseData(200, "ok", res)
        }
        return responseData(500, res.msg, {
          content: { type: "text", text: res.msg },
        })
      } else {
        const msg = `tool [${name}] not found`
        return responseData(404, msg, { content: { type: "text", text: msg } })
      }
    } catch (error) {
      const errorText = errorToText(error)
      return responseData(500, errorText, { content: { type: "text", text: errorText } })
    }
  }
  function registerIpc() {
    ipcMain.handle(IpcChannel.McpRegisterServer, async (_, params: MCPStdioServerParam) => {
      return registerServer(params)
    })
    ipcMain.handle(IpcChannel.McpToggleServer, async (_, id: string, command: MCPClientHandleCommand) => {
      return toggleServer(id, command)
    })
    ipcMain.handle(IpcChannel.McpListTools, async (_, id?: string | Array<string>) => {
      return listTools(id)
    })
    ipcMain.handle(IpcChannel.McpCallTool, async (_, name: string, args?: Record<string, unknown>) => {
      return callTool(name, args)
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
