import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { serializeError } from "serialize-error"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { MCPStdioServersParams, MCPToolDetail, MCPServerContext, CallToolResult } from "@shared/types/mcp"
import { BridgeResponse, BridgeStatusResponse, code2xx, responseCode, responseData } from "@shared/types/bridge"
import { errorToText } from "@shared/error"
import { IpcChannel, MCPService } from "@shared/types/service"
import { ipcMain } from "electron"
import log from "electron-log"
import path from "node:path"
import { modifyPlatformCMD } from "./cmd"
export const useMCP = (): MCPService => {
  const context = new Map<string, MCPServerContext>()

  const newClient = () => new Client({ name: "aichat-mcp-client", version: "v0.0.1" })

  async function registerClient(name: string, serverParams: MCPStdioServersParams): Promise<BridgeStatusResponse> {
    try {
      let ctx = context.get(name)
      if (!ctx) {
        ctx = { params: serverParams }
      } else {
        if (ctx.client) {
          const pong = await ctx.client.ping()
          if (pong) {
            return responseCode(201, `${name} already created`)
          }
        }
      }
      ctx.client = newClient()
      const transport = new StdioClientTransport(modifyPlatformCMD(ctx.params))
      await ctx.client.connect(transport)
      transport.onerror = error => {
        log.error("[MCP registerClient]", errorToText(error))
      }
      log.debug("[MCP registerClient]", `${name} created`)
      context.set(name, ctx)
      return responseCode(200)
    } catch (error) {
      return responseCode(500, JSON.stringify(serializeError(error)))
    }
  }

  async function toggleClient(name: string, disabled: boolean): Promise<BridgeStatusResponse> {
    const ctx = context.get(name)
    if (!ctx) {
      return responseCode(404, `${name} not found`)
    }
    ctx.params.disabled = disabled
    return responseCode(200)
  }

  async function listTools(clientName?: string): Promise<BridgeResponse<MCPToolDetail[]>> {
    try {
      const labels = clientName ? [clientName] : context.keys()
      const toolRes: MCPToolDetail[][] = []
      for (const label of labels) {
        const ctx = context.get(label)
        if (ctx && ctx.client && !ctx.params.disabled) {
          const tools = (await ctx.client.listTools()).tools.map<MCPToolDetail>(tool => ({
            ...tool,
            serverName: label,
          }))
          toolRes.push(tools)
        }
      }
      return responseData(200, "ok", toolRes.flat())
    } catch (error) {
      return responseData(500, JSON.stringify(serializeError(error)), [])
    }
  }
  // async function listPrompts(label?: string) {}
  // async function listResources(label?: string) {}
  async function callTool(toolname: string, args?: Record<string, unknown>): Promise<BridgeResponse<CallToolResult>> {
    try {
      const tools = await listTools()
      const tool = tools.data.find(tool => tool.name === toolname)
      if (tool) {
        let ctx = context.get(tool.serverName)
        if (!ctx) {
          const msg = `server ${tool.serverName} not found`
          return responseData(500, msg, { content: { type: "text", text: msg } })
        }
        const res = await registerClient(tool.serverName, ctx.params)
        if (code2xx(res.code)) {
          ctx = context.get(tool.serverName)!
          const res = (await ctx.client!.callTool({ name: toolname, args })) as CallToolResult
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
    registerClient,
    toggleClient,
    listTools,
    callTool,
  }
}
export const registerMCP = async () => {
  const mcp = useMCP()
  ipcMain.handle(IpcChannel.McpRegisterClient, async (_, name: string, serverParams: MCPStdioServersParams) => {
    return mcp.registerClient(name, serverParams)
  })
  ipcMain.handle(IpcChannel.McpToggleClient, async (_, name: string, disabled: boolean) => {
    return mcp.toggleClient(name, disabled)
  })
  ipcMain.handle(IpcChannel.McpListTools, async (_, clientName?: string) => {
    return mcp.listTools(clientName)
  })
  ipcMain.handle(IpcChannel.McpCallTool, async (_, name: string, args?: Record<string, unknown>) => {
    return mcp.callTool(name, args)
  })
  await mcp.registerClient("everything", {
    command: "npx",
    disabled: false,
    args: ["-y", "@modelcontextprotocol/server-everything"],
  })
  await mcp.registerClient("filesystem", {
    command: "npx",
    disabled: false,
    args: ["-y", "@modelcontextprotocol/server-filesystem", path.normalize("D:\\")],
  })
}
