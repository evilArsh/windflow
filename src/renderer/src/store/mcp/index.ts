import { MCPServerParam, MCPServerParamCore } from "@shared/types/mcp"
import { defineStore } from "pinia"
import { useData } from "./data"
import { cloneDeep } from "lodash-es"
import { useToolName } from "@shared/mcp"
import { EventKey } from "@shared/types/eventbus"
import PQueue from "p-queue"
const nanoIdAlphabet = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
export default defineStore("mcp", () => {
  const queue = markRaw(new PQueue({ concurrency: 1 }))
  const servers = reactive<MCPServerParam[]>([])
  const api = useData(servers)
  const toolName = useToolName()
  /**
   * 去掉多余mcp tool列表
   */
  function clonePure(server: MCPServerParam): MCPServerParam {
    return cloneDeep({ ...server, tools: [], prompts: [], resources: [], resourceTemplates: [] })
  }
  function createNewId(): string {
    return uniqueNanoId(nanoIdAlphabet, 12)
  }
  function findServer(serverId: string): MCPServerParam | undefined {
    return servers.find(v => v.id === serverId)
  }
  async function remove(topicId: string, serverId: string) {
    await api.del(serverId)
    const index = servers.findIndex(v => v.id === serverId)
    index >= 0 && servers.splice(index, 1)
    window.api.mcp.stopServer(topicId, serverId)
  }
  function restart(topicId: string, serverId: string, params?: MCPServerParamCore) {
    window.api.mcp.restartServer(topicId, serverId, params ? params : undefined)
  }
  function start(topicId: string, server: MCPServerParam) {
    window.api.mcp.startServer(topicId, clonePure(server))
  }
  function stop(topicId: string, serverId: string) {
    window.api.mcp.stopServer(topicId, serverId)
  }
  async function fetchTools(serverId: string) {
    const server = findServer(serverId)
    if (!server) return
    if (
      server.tools?.length ||
      server.prompts?.length ||
      server.resources?.length ||
      server.resourceTemplates?.length
    ) {
      return
    }
    const [tools, prompts, resources, resourceTemplates] = await Promise.allSettled([
      window.api.mcp.listTools(serverId),
      window.api.mcp.listPrompts(serverId),
      window.api.mcp.listResources(serverId),
      window.api.mcp.listResourceTemplates(serverId),
    ])
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

  window.api.bus.on(EventKey.MCPStatusUpdate, async data => {
    // console.log("[MCPStatusUpdate]", data)
    const server = findServer(data.id)
    if (!server) return
    const status = data.status
    server.status = status
    server.referTopics = data.refs
    queue.add(() => api.update(clonePure(server)))
    fetchTools(server.id)
  })
  return {
    servers,
    api,
    fetchTools,
    remove,
    restart,
    start,
    stop,
    clonePure,
    createNewId,
    findServer,
  }
})
