import { MCPStdioServer } from "@renderer/types"
import { defineStore } from "pinia"
import { Reactive } from "vue"
import { mcpStdioDefault } from "./default/mcp.default"
import { db } from "@renderer/usable/useDatabase"

const useData = (servers: Reactive<MCPStdioServer[]>) => {
  async function update(data: MCPStdioServer) {
    try {
      return db.mcpServer.update(data.id, data)
    } catch (error) {
      console.log(`[update mcp server error] ${(error as Error).message}`)
      return 0
    }
  }
  async function add(data: MCPStdioServer) {
    try {
      return db.mcpServer.add(data)
    } catch (error) {
      console.log(`[add mcp server error] ${(error as Error).message}`)
      return 0
    }
  }
  async function getAll() {
    return db.mcpServer.toArray()
  }
  async function fetch() {
    try {
      servers.length = 0
      const defaultData = mcpStdioDefault()
      const data = await db.mcpServer.toArray()
      data.forEach(v => {
        servers.push(v)
      })
      for (const v of defaultData) {
        if (!servers.find(server => server.id === v.id)) {
          servers.push(v)
          await db.mcpServer.add(v)
        }
      }
    } catch (error) {
      console.log(`[fetch mcp servers error] ${(error as Error).message}`)
    }
  }
  return {
    add,
    fetch,
    update,
    getAll,
  }
}
export default defineStore("mcp", () => {
  const servers = reactive<MCPStdioServer[]>([])
  const api = useData(servers)
  return {
    servers,
    api,
  }
})
