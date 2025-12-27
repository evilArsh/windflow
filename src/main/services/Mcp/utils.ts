import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import { MCPClientStatus, MCPServerParam, ToolEnvironment, EventBus, EventKey } from "@windflow/shared"
import { HttpStatusCode, cloneDeep, errorToText } from "@toolmain/shared"
import { MCPClientContext } from "./types"
import { log } from "./vars"
import { platform } from "@electron-toolkit/utils"

function modifyPlatformCMD(env: ToolEnvironment, param: MCPServerParam): MCPServerParam {
  const p = cloneDeep(param)
  if (platform.isWindows) {
    const command = p.params.command.toLowerCase().trim()
    if (command === "npx") {
      p.params.command = env.bun.path.trim()
      const args = p.params.args ?? []
      if (!args.includes("-y")) {
        args.unshift("-y")
      }
      if (!args.includes("x")) {
        args.unshift("x")
      }
      if (env.npm.registry) {
        p.params.env["NPM_CONFIG_REGISTRY"] = env.npm.registry
      }
      p.params.args = args
    } else if (command === "uvx" || command === "uv") {
      p.params.command = env.uv.path.trim()
      const args = p.params.args ?? []
      args.unshift("run")
      args.unshift("tool")
      if (env.python.registry) {
        p.params.env["UV_DEFAULT_INDEX"] = env.python.registry
        p.params.env["PIP_INDEX_URL"] = env.python.registry
      }
      p.params.args = args
    }
  }
  return p
}

export function createClient(name: string, version: string) {
  return new Client({ name, version })
}
export async function createStdioTransport(client: Client, env: ToolEnvironment, params: MCPServerParam) {
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
export async function createStreamableTransport(client: Client, params: MCPServerParam) {
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
export async function createSseTransport(client: Client, params: MCPServerParam) {
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
export async function requestWithId<T>(
  serverId: string,
  request: () => Promise<T> | T
): Promise<{ id: string; data: T }> {
  const req = request()
  if (req instanceof Promise) {
    const data = await req
    return { id: serverId, data }
  }
  return { id: serverId, data: req }
}

export const emitStatus = (
  globalBus: EventBus,
  serverId: string,
  serverName: string,
  status: MCPClientStatus,
  refs: Array<string>,
  code?: HttpStatusCode,
  msg?: string
) => {
  globalBus.emit(EventKey.MCPStatus, {
    id: serverId,
    name: serverName,
    status,
    refs,
    code,
    msg,
  })
}

export function useMCPContext() {
  const context = new Map<string, MCPClientContext>()
  function addContextRef(contextId: string, topicId: string) {
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
  function hasTopicReference(contextId: string, topicId: string): boolean {
    return getTopicReference(contextId).includes(topicId)
  }
  function getServersByTopic(topicId: string): Array<string> {
    return Array.from(context.values())
      .filter(ctx => ctx.reference.includes(topicId))
      .map(ctx => ctx.params.id)
  }
  function removeReference(topicId: string, id: string) {
    const ctx = getContext(id)
    if (ctx) {
      ctx.reference = ctx.reference.filter(item => item !== topicId)
    }
  }
  function dispose() {
    context.forEach(ctx => {
      ctx.client?.close()
    })
    context.clear()
  }
  return {
    context,
    addContextRef,
    getContext,
    createContext,
    removeContext,
    getTopicReference,
    hasTopicReference,
    getServersByTopic,
    removeReference,
    dispose,
  }
}
