import { MCPClientStatus, MCPRootTopicId, MCPServerParam } from "@shared/types/mcp"
import { defineStore } from "pinia"
import { useData } from "./data"
import { cloneDeep } from "lodash-es"
import { code2xx } from "@shared/types/bridge"
import { useToolName } from "@shared/mcp"
export default defineStore("mcp", () => {
  const servers = reactive<MCPServerParam[]>([])
  const api = useData(servers)
  const toolName = useToolName()
  const { t } = useI18n()

  function findServer(serverId: string) {
    return servers.find(v => v.id === serverId)
  }
  async function remove(serverId: string, topicId?: string) {
    const resDel = await api.del(serverId)
    if (resDel == 0) {
      throw new Error(t("tip.deleteFailed"))
    }
    await window.api.mcp.toggleServer(topicId ?? MCPRootTopicId, serverId, { command: "delete" })
    const index = servers.findIndex(v => v.id === serverId)
    index > -1 && servers.splice(index, 1)
  }
  async function restart(serverId: string, topicId?: string) {
    const res = await window.api.mcp.toggleServer(topicId ?? MCPRootTopicId, serverId, { command: "restart" })
    if (code2xx(res.code) || res.code == 404) {
      return fetchTools(serverId, topicId)
    } else {
      throw new Error(res.msg)
    }
  }
  async function fetchTools(serverId: string, topicId?: string) {
    if (!serverId) return
    const server = findServer(serverId)
    if (!server) return
    server.status = MCPClientStatus.Connecting
    const res = await window.api.mcp.registerServer(topicId ?? MCPRootTopicId, cloneDeep(server))
    if (!findServer(serverId)) return
    server.status = res.data
    if (code2xx(res.code)) {
      const [tools, prompts, resources, resourceTemplates] = await Promise.allSettled([
        window.api.mcp.listTools(server.id),
        window.api.mcp.listPrompts(server.id),
        window.api.mcp.listResources(server.id),
        window.api.mcp.listResourceTemplates(server.id),
      ])
      if (!findServer(serverId)) return
      server.tools =
        tools.status == "fulfilled"
          ? tools.value.data.map(v => {
              return { ...v, name: toolName.split(v.name).name }
            })
          : []
      server.prompts =
        prompts.status == "fulfilled"
          ? prompts.value.data.prompts.map(v => {
              return { ...v, name: toolName.split(v.name).name }
            })
          : []
      server.resources =
        resources.status == "fulfilled"
          ? resources.value.data.resources.map(v => {
              return { ...v, name: toolName.split(v.name).name }
            })
          : []
      server.resourceTemplates =
        resourceTemplates.status == "fulfilled"
          ? resourceTemplates.value.data.resourceTemplates.map(v => {
              return { ...v, name: toolName.split(v.name).name }
            })
          : []
    }
  }
  return {
    servers,
    api,
    fetchTools,
    remove,
    restart,
  }
})
