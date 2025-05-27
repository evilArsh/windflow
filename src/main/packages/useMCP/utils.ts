import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import { MCPStdioServerParam, MCPStreamableServerParam } from "@shared/types/mcp"
// import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory'
import { modifyPlatformCMD } from "./cmd"
import log from "electron-log"
import { errorToText } from "@shared/error"
import { MCPClientContext } from "./types"

export function createClient(name: string, version: string) {
  return new Client({ name, version })
}
export async function createStdioTransport(client: Client, params: MCPStdioServerParam) {
  try {
    const transport = new StdioClientTransport(modifyPlatformCMD(params).params)
    await client.connect(transport)
    transport.onerror = error => {
      log.error("[MCP stdio transport]", errorToText(error))
    }
  } catch (error) {
    log.error("[createStdioTransport failed]", errorToText(error))
    throw error
  }
}
export async function createStreamableTransport(client: Client, params: MCPStreamableServerParam) {
  try {
    const transport = new StreamableHTTPClientTransport(new URL(params.params.url))
    await client.connect(transport)
    transport.onerror = error => {
      log.error("[MCP streamable transport]", errorToText(error))
    }
  } catch (error) {
    log.error("[createStreamableTransport failed]", errorToText(error))
    throw error
  }
}
export async function createSseTransport(client: Client, params: MCPStreamableServerParam) {
  try {
    const transport = new SSEClientTransport(new URL(params.params.url))
    await client.connect(transport)
    transport.onerror = error => {
      log.error("[MCP sse transport]", errorToText(error))
    }
  } catch (error) {
    log.error("[createSseTransport failed]", errorToText(error))
    throw error
  }
}
export function availableServerIds(context: Map<string, MCPClientContext>, id?: string | Array<string>): Array<string> {
  return id ? (Array.isArray(id) ? id : [id]) : Array.from(context.keys())
}

export function availableClients(
  context: Map<string, MCPClientContext>,
  id?: string | Array<string>
): Array<{ id: string; client: Client }> {
  const res: Array<{ id: string; client: Client }> = []
  const clientIds = availableServerIds(context, id)
  clientIds.forEach(id => {
    const ctx = context.get(id)
    if (ctx && ctx.client) {
      res.push({
        id,
        client: ctx.client,
      })
    }
  })
  return res
}
export async function requestWithId<T>(serverId: string, request: () => Promise<T>): Promise<{ id: string; data: T }> {
  const req = request()
  if (req instanceof Promise) {
    const data = await req
    return { id: serverId, data }
  }
  return { id: serverId, data: req }
}
