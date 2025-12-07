import { MCPClientStatus, MCPServerParam } from "@shared/types/mcp"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { resolveDb } from "../utils"
import { QueryParams } from "../../types"
import { mcpStdioDefault } from "../presets/mcp"

const queue = new PQueue({ concurrency: 1 })
export async function put(data: MCPServerParam, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).mcpServer.put(cloneDeep(data)))
}
export async function add(data: MCPServerParam, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).mcpServer.add(cloneDeep(data)))
}
export async function bulkAdd(datas: MCPServerParam[], params?: QueryParams) {
  return queue.add(async () => resolveDb(params).mcpServer.bulkAdd(cloneDeep(datas)))
}
export async function del(id: string, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).mcpServer.delete(id))
}
export async function getAll(params?: QueryParams) {
  return queue.add(async () => resolveDb(params).mcpServer.toArray())
}
export async function fetch(params?: QueryParams) {
  const servers: MCPServerParam[] = []
  const defaultData = mcpStdioDefault()
  const data = await queue.add(async () => resolveDb(params).mcpServer.toArray())
  data.forEach(v => {
    servers.push(v)
    if (v.status === MCPClientStatus.Connected || v.status === MCPClientStatus.Connecting) {
      v.referTopics?.forEach(topicId => {
        window.api.mcp.startServer(topicId, v)
      })
    }
  })
  const newCaches: MCPServerParam[] = []
  for (const v of defaultData) {
    if (!servers.find(server => server.id === v.id)) {
      newCaches.push(v)
    }
  }
  if (newCaches.length) {
    await queue.add(async () => resolveDb(params).mcpServer.bulkAdd(newCaches))
    servers.push(...newCaches)
  }

  return servers
}
