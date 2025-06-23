import { MCPClientStatus, MCPRootTopicId, MCPServerParam } from "@shared/types/mcp"
import { defineStore } from "pinia"
import { useData } from "./data"
import { cloneDeep } from "lodash-es"
import { BridgeResponse, code2xx, code4xx, code5xx } from "@shared/types/bridge"
import { useToolName } from "@shared/mcp"
export default defineStore("mcp", () => {
  const servers = reactive<MCPServerParam[]>([])
  // const topicServers = reactive<Record<string, MCPServerParam[]>>({})
  const api = useData(servers)
  const toolName = useToolName()
  const { t } = useI18n()

  // function getTopicServers(topicId: string): MCPServerParam[] {
  //   if (!topicServers[topicId]) {
  //     topicServers[topicId] = []
  //   }
  //   const refresh = async (topicId: string, currentServers: MCPServerParam[]) => {
  //     try {
  //       const activeServerIds = (await window.api.mcp.getTopicServers(topicId)).data
  //       currentServers.length = 0
  //       currentServers.push(
  //         ...servers.filter(server => {
  //           return (
  //             !server.status ||
  //             server.status == MCPClientStatus.Disconnected ||
  //             ((server.status === MCPClientStatus.Connected || server.status === MCPClientStatus.Connecting) &&
  //               activeServerIds.includes(server.id))
  //           )
  //         })
  //       )
  //     } catch (error) {
  //       console.error("[getTopicServers]", error)
  //     }
  //   }
  //   refresh(topicId, topicServers[topicId])
  //   return topicServers[topicId]
  // }
  async function toggleServer(serverId: string, topicId?: string): Promise<BridgeResponse<MCPClientStatus>> {
    const server = findServer(serverId)
    if (!server) return { code: 500, msg: "server not found", data: MCPClientStatus.Disconnected }
    if (server.status === MCPClientStatus.Connecting) {
      console.warn("[toggleServer] server is connecting, please wait")
      return { code: 102, msg: "server is connecting", data: MCPClientStatus.Connecting }
    }
    const toggle = async (server: MCPServerParam) => {
      const oldStatus = server.status
      try {
        server.status =
          !server.status || server.status === MCPClientStatus.Connected
            ? MCPClientStatus.Connecting
            : MCPClientStatus.Connected
        const res = await window.api.mcp.toggleServer(topicId ?? MCPRootTopicId, server.id, {
          command: server.status === MCPClientStatus.Connected ? "stop" : "start",
        })
        server.status = res.data
        if (code5xx(res.code)) {
          throw res
        } else if (code4xx(res.code)) {
          setStatus(server.id, MCPClientStatus.Connecting)
          const res = await window.api.mcp.registerServer(topicId ?? MCPRootTopicId, clonePure(server))
          server.status = res.data
          if (code5xx(res.code)) {
            throw res
          }
        }
        return res
      } catch (error) {
        server.status = oldStatus
        console.error("[toggleServer]", error)
        return error as BridgeResponse<MCPClientStatus>
      }
    }
    return toggle(server)
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
  return {
    servers,
    api,
    fetchTools,
    remove,
    restart,
    clonePure,
    findServer,
    // getTopicServers,
    toggleServer,
  }
})
