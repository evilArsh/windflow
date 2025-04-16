import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { serializeError } from "serialize-error"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { MCPStdioServersParams, MCPToolDetail, MCPServerContext } from "@shared/types/mcp"
import { BridgeResponse, BridgeStatusResponse, responseCode, responseData } from "@shared/types/bridge"
import { errorToText } from "@shared/error"
import { MCPService } from "@shared/types/service"

const useMCP = (): MCPService => {
  const context = new Map<string, MCPServerContext>()

  const newClient = () => new Client({ name: "aichat-mcp-client", version: "v0.0.1" })

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

  async function listAllTools(): Promise<BridgeResponse<MCPToolDetail[]>> {
    try {
      const toolRes: MCPToolDetail[][] = []
      for (const label of context.keys()) {
        const tools = await listTools(label)
        toolRes.push(tools.data)
      }
      return {
        code: 200,
        msg: "ok",
        data: toolRes.flat(),
      } as BridgeResponse<MCPToolDetail[]>
    } catch (error) {
      return { code: 500, msg: JSON.stringify(serializeError(error)), data: [] }
    }
  }
  return {
    registerClient,
    toggleServer,
    listTools,
    listAllTools,
  }
}
export default useMCP
