import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import { MCPClientStatus, MCPServerParam, MCPStdioServerParam, MCPStreamableServerParam } from "@shared/types/mcp"
import { modifyPlatformCMD } from "./cmd"
import log from "electron-log"
import { errorToText } from "@shared/error"
import { MCPClientContext } from "./types"
import { ToolEnvironment } from "@shared/types/env"

export function createClient(name: string, version: string) {
  return new Client({ name, version })
}
export async function createStdioTransport(client: Client, env: ToolEnvironment, params: MCPStdioServerParam) {
  try {
    const patchedParams = modifyPlatformCMD(env, params)
    // log.debug("[MCP createStdioTransport]", patchedParams)
    const transport = new StdioClientTransport(patchedParams.params)
    transport.onerror = error => {
      log.error("[MCP stdio transport]", errorToText(error))
    }
    await client.connect(transport)
    return transport
  } catch (error) {
    log.error("[createStdioTransport failed]", errorToText(error))
    throw error
  }
}
export async function createStreamableTransport(client: Client, params: MCPStreamableServerParam) {
  try {
    const transport = new StreamableHTTPClientTransport(new URL(params.params.url))
    transport.onerror = error => {
      log.error("[MCP streamable transport]", errorToText(error))
    }
    await client.connect(transport)
    return transport
  } catch (error) {
    log.error("[createStreamableTransport failed]", errorToText(error))
    throw error
  }
}
export async function createSseTransport(client: Client, params: MCPStreamableServerParam) {
  try {
    const transport = new SSEClientTransport(new URL(params.params.url))
    transport.onerror = error => {
      log.error("[MCP sse transport]", errorToText(error))
    }
    await client.connect(transport)
    return transport
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

export function useMCPContext() {
  const context = new Map<string, MCPClientContext>()
  function addContextRefCount(topicId: string, contextId: string) {
    const ctx = context.get(contextId)
    if (!ctx) return
    if (!ctx.reference.includes(topicId)) {
      ctx.reference.push(topicId)
    }
  }
  function getContext(contextId: string) {
    return context.get(contextId)
  }
  function createContext(params: MCPServerParam): MCPClientContext {
    const ctx = {
      params,
      reference: [],
      status: MCPClientStatus.Disconnected,
    }
    context.set(params.id, ctx)
    return ctx
  }
  async function removeContext(contextId: string) {
    const ctx = getContext(contextId)
    if (ctx) {
      await ctx.client?.close()
      context.delete(contextId)
    }
  }
  function getTopicReference(contextId: string): Array<string> {
    return getContext(contextId)?.reference ?? []
  }
  function removeReference(topicId: string, id: string) {
    const ctx = getContext(id)
    if (ctx) {
      ctx.reference = ctx.reference.filter(item => item !== topicId)
    }
  }
  return {
    context,
    addContextRefCount,
    getContext,
    createContext,
    removeContext,
    getTopicReference,
    removeReference,
  }
}
