import { db } from "@renderer/usable/useDatabase"
import { MCPServerParam } from "@shared/types/mcp"
import { Reactive } from "vue"
import { mcpStdioDefault } from "./default"
import { TopicMcpServer } from "@renderer/types"

export const useData = (servers: Reactive<MCPServerParam[]>) => {
  async function update(data: MCPServerParam) {
    try {
      return db.mcpServer.update(data.id, data)
    } catch (error) {
      console.log(`[update mcp server error]`, error)
      return 0
    }
  }
  async function add(data: MCPServerParam) {
    try {
      return db.mcpServer.add(data)
    } catch (error) {
      console.log(`[add mcp server error]`, error)
      return 0
    }
  }
  async function del(id: string) {
    try {
      return db.mcpServer.delete(id)
    } catch (error) {
      console.log(`[del mcp server error]`, error)
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
      console.log(`[fetch mcp servers error]`, error)
    }
  }
  return {
    add,
    del,
    fetch,
    update,
    getAll,
  }
}

export function useTopicMcpServerData() {
  async function update(data: TopicMcpServer) {
    try {
      return db.topicMcpServer.update(data.id, data)
    } catch (error) {
      console.log(`[update topic mcp server error]`, error)
      return 0
    }
  }
  async function add(data: TopicMcpServer) {
    try {
      return db.topicMcpServer.add(data)
    } catch (error) {
      console.log(`[add topic mcp server error]`, error)
      return 0
    }
  }
  async function bulkAdd(data: TopicMcpServer[]) {
    try {
      return db.topicMcpServer.bulkAdd(data)
    } catch (error) {
      console.log(`[add topic mcp server error]`, error)
      return 0
    }
  }
  async function del(id: string) {
    try {
      return db.topicMcpServer.delete(id)
    } catch (error) {
      console.log(`[del topic mcp server error]`, error)
      return 0
    }
  }
  async function listByTopicId(topicId: string) {
    return db.topicMcpServer.where("topicId").equals(topicId).toArray()
  }
  return {
    update,
    add,
    bulkAdd,
    del,
    listByTopicId,
  }
}
