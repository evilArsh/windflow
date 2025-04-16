import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { serializeError } from "serialize-error"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { mcpServers } from "./settings"
import { MCPStdioServersParams, MCPToolDetail, MCPServerContext } from "@shared/mcp"
import { BridgeResponse, BridgeStatusResponse, responseCode, responseData } from "@shared/bridge"
import { app } from "electron"
import { errorToText } from "@shared/error"

export default () => {
  const context = new Map<string, MCPServerContext>()

  const newClient = () => new Client({ name: "aichat-mcp-client", version: app.getVersion() })

  async function registerClient(label: string, serverParams: MCPStdioServersParams): Promise<BridgeStatusResponse> {
    try {
      let ctx = context.get(label)
      const transport = new StdioClientTransport(serverParams)
      if (!ctx) {
        ctx = { params: serverParams }
        context.set(label, ctx)
        return responseCode(200)
      } else {
        if (ctx.client) {
          const pong = await ctx.client.ping()
          if (pong) {
            return responseCode(201, `${label} already created`)
          }
        }
      }
      ctx.client = newClient()
      await ctx.client.connect(transport)
      transport.onerror = error => {
        console.log("[MCP registerClient]", errorToText(error))
      }
      return responseCode(200)
    } catch (error) {
      return responseCode(500, JSON.stringify(serializeError(error)))
    }
  }

  async function toggleServer(label: string, disabled: boolean): Promise<BridgeStatusResponse> {
    const ctx = context.get(label)
    if (!ctx) {
      return responseCode(404, `${label} not found`)
    }
    ctx.params.disabled = disabled
    return responseCode(200)
  }

  async function listTools(label: string): Promise<BridgeResponse<MCPToolDetail[]>> {
    const ctx = context.get(label)
    if (!ctx || !ctx.client) {
      return responseData(404, `${label} not found`, [])
    }
    if (ctx.params.disabled) {
      return responseData(200, "server disabled", [])
    }
    const tools = await ctx.client.listTools()
    return responseData(200, "ok", tools.tools)
  }

  async function listAllTools() {
    try {
      const toolRes: MCPToolDetail[][] = []
      for await (const ctx of context.values()) {
        if (ctx.client) {
          const tools = await ctx.client.listTools()
          toolRes.push(tools.tools)
        }
      }
      return {
        code: 200,
        msg: "ok",
        data: toolRes.flat(),
      } as BridgeResponse<MCPToolDetail[]>
    } catch (error) {
      return responseCode(500, JSON.stringify(serializeError(error)))
    }
  }
}

async function main() {
  // await registerServer("filesystem", mcpServers.filesystem)
  // await registerServer("everything", mcpServers.everything)
  // const all = await getAllTools()
  // console.log("---------------------")
  // console.log(all)
}
main()
