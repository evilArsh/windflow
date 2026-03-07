import { MCPClientStatus, MCPServerParam } from "@windai/shared"
import { cloneDeep } from "@toolmain/shared"
import { mcpStdioDefault, useDBQueue } from "@windai/core/storage"
import { QueryParams } from "@windai/core/types"

const queue = useDBQueue()
export async function put(data: MCPServerParam, params?: QueryParams) {
  return queue.add(db => db.mcpServer.put(cloneDeep(data)), params)
}
export async function add(data: MCPServerParam, params?: QueryParams) {
  return queue.add(db => db.mcpServer.add(cloneDeep(data)), params)
}
export async function bulkAdd(datas: MCPServerParam[], params?: QueryParams) {
  return queue.add(db => db.mcpServer.bulkAdd(cloneDeep(datas)), params)
}
export async function remove(id: string, params?: QueryParams) {
  return queue.add(db => db.mcpServer.delete(id), params)
}
export async function getAll() {
  return queue.add(db => db.mcpServer.toArray())
}
export async function fetch() {
  const servers: MCPServerParam[] = []
  const defaultData = mcpStdioDefault()
  const data = await queue.add(db => db.mcpServer.toArray())
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
    await queue.add(db => db.mcpServer.bulkAdd(newCaches))
    servers.push(...newCaches)
  }

  return servers
}
