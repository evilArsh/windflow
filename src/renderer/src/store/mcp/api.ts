import { db } from "@renderer/db"
import { MCPClientStatus, MCPServerParam } from "@shared/types/mcp"
import { mcpStdioDefault } from "./default"
import { cloneDeep } from "@toolmain/shared"

export const useData = () => {
  async function update(data: MCPServerParam) {
    return db.mcpServer.put(cloneDeep(data))
  }
  async function add(data: MCPServerParam) {
    return db.mcpServer.add(cloneDeep(data))
  }
  async function del(id: string) {
    return db.mcpServer.delete(id)
  }
  async function getAll() {
    return db.mcpServer.toArray()
  }
  async function fetch() {
    const servers: MCPServerParam[] = []
    const defaultData = mcpStdioDefault()
    const data = await db.mcpServer.toArray()
    data.forEach(v => {
      servers.push(v)
      if (v.status === MCPClientStatus.Connected || v.status === MCPClientStatus.Connecting) {
        v.referTopics?.forEach(topicId => {
          window.api.mcp.startServer(topicId, v)
        })
      }
    })
    for (const v of defaultData) {
      if (!servers.find(server => server.id === v.id)) {
        servers.push(v)
        await db.mcpServer.add(v)
      }
    }
    return servers
  }
  return {
    add,
    del,
    fetch,
    update,
    getAll,
  }
}
