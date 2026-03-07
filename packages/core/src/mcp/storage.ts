import { MCPServerParam } from "@windai/shared"
import { storage } from "@windai/core/storage"

export class MCPStorage {
  async add(data: MCPServerParam) {
    return storage.mcp.add(data)
  }
  async bulkAdd(data: MCPServerParam[]) {
    return storage.mcp.bulkAdd(data)
  }
  async remove(serverId: string) {
    return storage.mcp.remove(serverId)
  }
  async put(data: MCPServerParam) {
    return storage.mcp.put(data)
  }
  async getAll() {
    return storage.mcp.getAll()
  }
  async fetch() {
    return storage.mcp.fetch()
  }
}
