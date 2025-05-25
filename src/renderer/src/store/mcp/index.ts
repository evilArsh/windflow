import { MCPServerParam } from "@shared/types/mcp"
import { defineStore } from "pinia"
import { useData } from "./data"
export default defineStore("mcp", () => {
  const servers = reactive<MCPServerParam[]>([])
  const api = useData(servers)
  return {
    servers,
    api,
  }
})
