import { MCPServerParam, MCPStdioServerParamCore, MCPStreamableServerParamCore } from "@shared/types/mcp"
import { defineStore } from "pinia"
import { useData } from "./data"
import { cloneDeep } from "lodash-es"
import { useToolName } from "@shared/mcp"
import { EventKey } from "@shared/types/eventbus"
export default defineStore("mcp", () => {
  const servers = reactive<MCPServerParam[]>([])
  const api = useData(servers)
  const toolName = useToolName()
  const { t } = useI18n()
  /**
   * 去掉多余mcp tool列表
   */
  function clonePure(server: MCPServerParam): MCPServerParam {
    return cloneDeep({ ...server, tools: [], prompts: [], resources: [], resourceTemplates: [] })
  }
  function findServer(serverId: string): MCPServerParam | undefined {
    return servers.find(v => v.id === serverId)
  }
  // function setStatus(serverId: string, status: MCPClientStatus): boolean {
  //   const server = findServer(serverId)
  //   if (server) {
  //     server.status = status
  //     return true
  //   }
  //   return false
  // }
  async function remove(topicId: string, serverId: string) {
    const res = await api.del(serverId)
    if (res == 0) {
      throw new Error(t("tip.deleteFailed"))
    }
    const index = servers.findIndex(v => v.id === serverId)
    index >= 0 && servers.splice(index, 1)
    window.api.mcp.stopServer(topicId, serverId)
  }
  function restart(topicId: string, serverId: string, params?: MCPStreamableServerParamCore | MCPStdioServerParamCore) {
    window.api.mcp.restartServer(topicId, serverId, params)
  }
  function start(topicId: string, server: MCPServerParam) {
    window.api.mcp.startServer(topicId, server)
  }
  async function fetchTools(serverId: string) {
    const [tools, prompts, resources, resourceTemplates] = await Promise.allSettled([
      window.api.mcp.listTools(serverId),
      window.api.mcp.listPrompts(serverId),
      window.api.mcp.listResources(serverId),
      window.api.mcp.listResourceTemplates(serverId),
    ])
    const server = findServer(serverId)
    if (!server) return
    if (tools.status == "fulfilled") {
      server.tools = tools.value.data.map(v => {
        return { ...v, name: toolName.split(v.name).name }
      })
    }
    if (prompts.status == "fulfilled") {
      server.prompts = prompts.value.data.prompts.map(v => {
        return { ...v, name: toolName.split(v.name).name }
      })
    }
    if (resources.status == "fulfilled") {
      server.resources = resources.value.data.resources.map(v => {
        return { ...v, name: toolName.split(v.name).name }
      })
    }
    if (resourceTemplates.status == "fulfilled") {
      server.resourceTemplates = resourceTemplates.value.data.resourceTemplates.map(v => {
        return { ...v, name: toolName.split(v.name).name }
      })
    }
  }

  window.api.bus.on(EventKey.MCPStatusUpdate, data => {
    console.log("[MCPStatusUpdate]", data)
  })
  return {
    servers,
    api,
    fetchTools,
    remove,
    restart,
    start,
    clonePure,
    findServer,
  }
})
