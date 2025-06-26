import { MCPClientStatus, MCPRootTopicId, MCPServerParam } from "@shared/types/mcp"
import { defineStore } from "pinia"
import { useData, useTopicMcpServerData } from "./data"
import { cloneDeep } from "lodash-es"
import { BridgeResponse, code2xx, code4xx, code5xx } from "@shared/types/bridge"
import { useToolName } from "@shared/mcp"
import { EventKey } from "@shared/types/eventbus"
import { TopicMcpServer } from "@renderer/types"
export default defineStore("mcp", () => {
  const servers = reactive<MCPServerParam[]>([])
  const topicServers = reactive<Record<string, TopicMcpServer[]>>({})
  const api = useData(servers)
  const apiTopicMcp = useTopicMcpServerData()
  const toolName = useToolName()
  const { t } = useI18n()

  function getTopicServers(topicId: string): TopicMcpServer[] {
    if (!topicServers[topicId]) {
      topicServers[topicId] = []
    }
    const transData = (servers: MCPServerParam[]): TopicMcpServer[] => {
      return servers.map(server => ({
        id: uniqueId(),
        topicId,
        oldMcpServerId: server.id,
        server: clonePure(server),
      }))
    }
    const refresh = async (topicId: string, currentServers: TopicMcpServer[]) => {
      try {
        let newServers: TopicMcpServer[] = []
        if (!currentServers.length) {
          const topicServers = await apiTopicMcp.listByTopicId(topicId)
          if (!topicServers.length) {
            newServers = transData(servers)
            currentServers.push(...newServers)
          } else {
            newServers = transData(
              servers.filter(server => !topicServers.find(item => item.oldMcpServerId === server.id))
            )
            currentServers.push(...topicServers, ...newServers)
          }
        } else {
          newServers = transData(
            servers.filter(server => !currentServers.find(item => item.oldMcpServerId === server.id))
          )
          currentServers.push(...newServers)
        }
        if (newServers.length) {
          apiTopicMcp.bulkAdd(cloneDeep(newServers))
        }
      } catch (error) {
        console.error("[refresh topicServers]", error)
      }
    }
    refresh(topicId, topicServers[topicId])
    return topicServers[topicId]
  }
  /**
   * 去掉多余mcp tool列表
   */
  function clonePure(server: MCPServerParam): MCPServerParam {
    return cloneDeep({ ...server, tools: [], prompts: [], resources: [], resourceTemplates: [] })
  }
  function findServer(serverId: string) {
    return servers.find(v => v.id === serverId)
  }
  function setStatus(serverId: string, status: MCPClientStatus): boolean {
    const server = findServer(serverId)
    if (server) {
      server.status = status
      return true
    }
    return false
  }
  // TODO: 考虑新的topicServers
  async function remove(serverId: string, topicId?: string) {
    const resDel = await api.del(serverId)
    if (resDel == 0) {
      throw new Error(t("tip.deleteFailed"))
    }
    await window.api.mcp.toggleServer(topicId ?? MCPRootTopicId, serverId, { command: "stop" })
    const index = servers.findIndex(v => v.id === serverId)
    index > -1 && servers.splice(index, 1)
  }
  // TODO: 考虑新的topicServers
  function restart(serverId: string, topicId?: string) {
    window.api.mcp.toggleServer(topicId ?? MCPRootTopicId, serverId, { command: "restart" })
  }
  async function fetchTools(serverId: string, topicId?: string) {
    const server = findServer(serverId)
    if (!server) return
    setStatus(serverId, MCPClientStatus.Connecting)
    const res = await window.api.mcp.registerServer(topicId ?? MCPRootTopicId, clonePure(server))
    if (!findServer(serverId)) return
    setStatus(serverId, res.data)
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

  window.api.bus.on(EventKey.MCPStatusUpdate, data => {
    console.log("[MCPStatusUpdate]", data)
  })
  return {
    servers,
    api,
    fetchTools,
    remove,
    restart,
    clonePure,
    findServer,
    toggleServer,
  }
})
