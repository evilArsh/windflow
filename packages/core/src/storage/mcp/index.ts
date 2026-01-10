import { MCPClientStatus, MCPServerParam } from "@windflow/shared"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { resolveDb } from "../utils"
import { QueryParams } from "../../types"
import { mcpStdioDefault } from "../presets/mcp"
import { db } from "../index"

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
export async function remove(id: string, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).mcpServer.delete(id))
}
export async function getAll() {
  return queue.add(async () => db.mcpServer.toArray())
}
export async function fetch() {
  const servers: MCPServerParam[] = []
  const defaultData = mcpStdioDefault()
  const data = await queue.add(async () => db.mcpServer.toArray())
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
    await queue.add(async () => db.mcpServer.bulkAdd(newCaches))
    servers.push(...newCaches)
  }

  return servers
}
