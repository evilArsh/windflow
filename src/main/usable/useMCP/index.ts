import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { serializeError } from "serialize-error"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import {
  MCPStdioServersParams,
  MCPToolDetail,
  MCPServerContext,
  MCPCallToolResult,
  MCPListResourcesRequestParams,
  MCPListResourcesResponse,
  MCPListPromptsRequestParams,
  MCPListPromptsResponse,
  MCPListResourceTemplatesParams,
  MCPListResourceTemplatesResponse,
  MCPServerHandleCommand,
} from "@shared/types/mcp"
import { BridgeResponse, BridgeStatusResponse, code2xx, responseCode, responseData } from "@shared/types/bridge"
import { errorToText } from "@shared/error"
import { IpcChannel, MCPService } from "@shared/types/service"
import { ipcMain } from "electron"
import log from "electron-log"
import { modifyPlatformCMD } from "./cmd"
import { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol"
export const useMCP = (): MCPService => {
  const context = new Map<string, MCPServerContext>()
  const newClient = () => new Client({ name: "aichat-mcp-client", version: "v0.0.1" })
  const cachedTools: Record<string, MCPToolDetail[]> = {}

  const availableServerNames = (serverName?: string | Array<string>): Array<string> => {
    return serverName ? (Array.isArray(serverName) ? serverName : [serverName]) : Array.from(context.keys())
  }
  const availableClients = (serverName?: string | Array<string>): Array<{ serverName: string; client: Client }> => {
    const res: Array<{ serverName: string; client: Client }> = []
    const serverNames = availableServerNames(serverName)
    serverNames.forEach(serverName => {
      const ctx = context.get(serverName)
      if (ctx && ctx.client) {
        res.push({
          serverName,
          client: ctx.client,
        })
      }
    })
    return res
  }
  const requestWithName = async <T>(
    serverName: string,
    request: () => Promise<T>
  ): Promise<{ serverName: string; data: T }> => {
    const req = request()
    if (req instanceof Promise) {
      const data = await req
      return { serverName, data }
    }
    return { serverName, data: req }
  }

  async function registerServer(
    serverName: string,
    serverParams: MCPStdioServersParams
  ): Promise<BridgeStatusResponse> {
    try {
      let ctx = context.get(serverName)
      if (!ctx) {
        ctx = { params: serverParams }
        log.debug("[MCP registerServer]", `${serverName}:${serverParams.args} context not found create new one`)
      } else {
        if (ctx.client) {
          const pong = await ctx.client.ping()
          if (pong) {
            log.debug("[MCP registerServer]", `${serverName}:${serverParams.args} already created`)
            return responseCode(201, `${serverName}:${serverParams.args} already created`)
          } else {
            log.debug(
              "[MCP registerServer]",
              `${serverName}:${serverParams.args} context found but client not connected`
            )
          }
        } else {
          log.debug("[MCP registerServer]", `${serverName}:${serverParams.args} context found but client not created`)
        }
      }
      ctx.client = newClient()
      const transport = new StdioClientTransport(modifyPlatformCMD(ctx.params))
      await ctx.client.connect(transport)
      transport.onerror = error => {
        log.error("[MCP registerServer]", errorToText(error))
      }
      log.debug("[MCP registerServer]", `${serverName}:${serverParams.args} created`)
      context.set(serverName, ctx)
      return responseCode(200)
    } catch (error) {
      return responseCode(500, JSON.stringify(serializeError(error)))
    }
  }
  async function toggleServer(serverName: string, command: MCPServerHandleCommand): Promise<BridgeStatusResponse> {
    const ctx = context.get(serverName)
    if (!ctx) {
      return responseCode(404, `${serverName} not found`)
    }
    switch (command.command) {
      case "start":
        return registerServer(serverName, ctx.params)
      case "stop":
        if (ctx.client) {
          await ctx.client.close()
          ctx.client = undefined
        }
        return responseCode(200, "ok")
      case "restart":
        await toggleServer(serverName, { command: "stop" })
        return toggleServer(serverName, { command: "start" })
      case "delete": {
        const res = await toggleServer(serverName, { command: "stop" })
        if (code2xx(res.code)) {
          context.delete(serverName)
        }
        return res
      }
    }
  }
  async function listTools(serverName?: string | Array<string>): Promise<BridgeResponse<MCPToolDetail[]>> {
    const results: MCPToolDetail[][] = []
    try {
      const clients = availableClients(serverName)
      const filterClient: ReturnType<typeof availableClients> = []
      clients.forEach(client => {
        if (cachedTools[client.serverName]) {
          results.push(cachedTools[client.serverName])
        } else {
          filterClient.push(client)
        }
      })
      const asyncReqs: Array<Promise<{ serverName: string; data: Awaited<ReturnType<Client["listTools"]>> }>> = []
      for (const client of filterClient) {
        asyncReqs.push(requestWithName(client.serverName, () => client.client.listTools()))
      }
      if (asyncReqs.length > 0) {
        const res = await Promise.allSettled(asyncReqs)
        res.forEach(res => {
          if (res.status === "fulfilled") {
            const dst = res.value.data.tools.map<MCPToolDetail>(tool =>
              Object.assign(tool, {
                serverName: res.value.serverName,
              })
            )
            results.push(dst)
            cachedTools[res.value.serverName] = dst
            log.debug("[MCP listTools]", `${res.value.serverName} tools cached`)
          }
        })
      }
      return responseData(200, "ok", results.flat())
    } catch (error) {
      return responseData(500, JSON.stringify(serializeError(error)), [])
    }
  }
  async function listPrompts(
    serverName?: string | Array<string>,
    params?: MCPListPromptsRequestParams,
    options?: RequestOptions
  ): Promise<BridgeResponse<MCPListPromptsResponse>> {
    const results: MCPListPromptsResponse = { prompts: [] }
    try {
      const asyncReqs: Array<Promise<{ serverName: string; data: Awaited<ReturnType<Client["listPrompts"]>> }>> = []
      const clients = availableClients(serverName)
      for (const client of clients) {
        asyncReqs.push(requestWithName(client.serverName, () => client.client.listPrompts(params, options)))
      }
      const res = await Promise.allSettled(asyncReqs)
      res.forEach(r => {
        if (r.status === "fulfilled") {
          results.prompts.push(...r.value.data.prompts)
        }
      })
      return responseData(200, "ok", results)
    } catch (error) {
      return responseData(500, JSON.stringify(serializeError(error)), results)
    }
  }
  async function listResources(
    serverName?: string | Array<string>,
    params?: MCPListResourcesRequestParams,
    options?: RequestOptions
  ): Promise<BridgeResponse<MCPListResourcesResponse>> {
    const results: MCPListResourcesResponse = { resources: [] }
    try {
      const asyncReqs: Array<Promise<{ serverName: string; data: Awaited<ReturnType<Client["listResources"]>> }>> = []
      const clients = availableClients(serverName)
      for (const client of clients) {
        asyncReqs.push(requestWithName(client.serverName, () => client.client.listResources(params, options)))
      }
      const res = await Promise.allSettled(asyncReqs)
      res.forEach(r => {
        if (r.status === "fulfilled") {
          results.resources.push(...r.value.data.resources)
        }
      })
      return responseData(200, "ok", results)
    } catch (error) {
      return responseData(500, JSON.stringify(serializeError(error)), results)
    }
  }
  async function listResourceTemplates(
    serverName?: string | Array<string>,
    params?: MCPListResourceTemplatesParams,
    options?: RequestOptions
  ): Promise<BridgeResponse<MCPListResourceTemplatesResponse>> {
    const results: MCPListResourceTemplatesResponse = { resourceTemplates: [] }
    try {
      const asyncReqs: Array<
        Promise<{ serverName: string; data: Awaited<ReturnType<Client["listResourceTemplates"]>> }>
      > = []
      const clients = availableClients(serverName)
      for (const client of clients) {
        asyncReqs.push(requestWithName(client.serverName, () => client.client.listResourceTemplates(params, options)))
      }
      const res = await Promise.allSettled(asyncReqs)
      res.forEach(r => {
        if (r.status === "fulfilled") {
          results.resourceTemplates.push(...r.value.data.resourceTemplates)
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
        let ctx = context.get(tool.serverName)
        if (!ctx) {
          const msg = `server ${tool.serverName} not found`
          return responseData(500, msg, { content: { type: "text", text: msg } })
        }
        const res = await registerServer(tool.serverName, ctx.params)
        if (code2xx(res.code)) {
          ctx = context.get(tool.serverName)!
          const res = (await ctx.client!.callTool({
            name: toolname,
            arguments: args,
          })) as MCPCallToolResult
          return responseData(200, "ok", res)
        }
        return responseData(500, res.msg, {
          content: { type: "text", text: res.msg },
        })
      } else {
        const msg = `tool ${toolname} not found`
        return responseData(404, msg, { content: { type: "text", text: msg } })
      }
    } catch (error) {
      return responseData(500, JSON.stringify(serializeError(error)), {
        content: { type: "text", text: errorToText(error) },
      })
    }
  }
  return {
    registerServer,
    toggleServer,
    listTools,
    callTool,
    listPrompts,
    listResources,
    listResourceTemplates,
  }
}
export const registerMCP = async () => {
  const mcp = useMCP()
  ipcMain.handle(IpcChannel.McpRegisterServer, async (_, name: string, serverParams: MCPStdioServersParams) => {
    return mcp.registerServer(name, serverParams)
  })
  ipcMain.handle(IpcChannel.McpToggleServer, async (_, name: string, command: MCPServerHandleCommand) => {
    return mcp.toggleServer(name, command)
  })
  ipcMain.handle(IpcChannel.McpListTools, async (_, clientName?: string) => {
    return mcp.listTools(clientName)
  })
  ipcMain.handle(IpcChannel.McpCallTool, async (_, name: string, args?: Record<string, unknown>) => {
    return mcp.callTool(name, args)
  })
  ipcMain.handle(
    IpcChannel.McpListPrompts,
    async (_, serverName?: string | Array<string>, params?: MCPListPromptsRequestParams, options?: RequestOptions) => {
      return mcp.listPrompts(serverName, params, options)
    }
  )
  ipcMain.handle(
    IpcChannel.McpListResources,
    async (
      _,
      serverName?: string | Array<string>,
      params?: MCPListResourcesRequestParams,
      options?: RequestOptions
    ) => {
      return mcp.listResources(serverName, params, options)
    }
  )
  ipcMain.handle(
    IpcChannel.McpListResourceTemplates,
    async (
      _,
      serverName?: string | Array<string>,
      params?: MCPListResourceTemplatesParams,
      options?: RequestOptions
    ) => {
      return mcp.listResourceTemplates(serverName, params, options)
    }
  )
}
