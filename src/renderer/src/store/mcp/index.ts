import { MCPServerParam, MCPServerParamCore } from "@shared/types/mcp"
import { defineStore } from "pinia"
import { useData } from "../../core/storage/mcp"

import { EventKey } from "@shared/types/eventbus"
import PQueue from "p-queue"
import { cloneDeep, uniqueNanoId } from "@toolmain/shared"
const nanoIdAlphabet = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
export default defineStore("mcp", () => {
  const queue = markRaw(new PQueue({ concurrency: 1 }))
  const servers = reactive<MCPServerParam[]>([])
  const api = useData()
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
  function restart(topicId: string, serverId: string, params?: MCPServerParamCore) {
    return window.api.mcp.restartServer(topicId, serverId, params ? params : undefined)
  }
  function start(topicId: string, server: MCPServerParam) {
    return window.api.mcp.startServer(topicId, clonePure(server))
  }
  function stop(topicId: string, serverId: string) {
    return window.api.mcp.stopServer(topicId, serverId)
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
      server.tools = tools.value.data
    }
    if (prompts.status == "fulfilled") {
      server.prompts = prompts.value.data.prompts
    }
    if (resources.status == "fulfilled") {
      server.resources = resources.value.data.resources
    }
    if (resourceTemplates.status == "fulfilled") {
      server.resourceTemplates = resourceTemplates.value.data.resourceTemplates
    }
  }
  async function add(newData: MCPServerParam) {
    await api.add(newData)
    servers.push(newData)
    return newData
  }
  async function bulkAdd(newDatas: MCPServerParam[]) {
    await api.bulkAdd(newDatas)
    servers.push(...newDatas)
    return newDatas
  }
  /**
   * 停止并删除 `topicId` 下的 `serverId`
   */
  async function remove(topicId: string, serverId: string) {
    await api.del(serverId)
    const index = servers.findIndex(v => v.id === serverId)
    index >= 0 && servers.splice(index, 1)
    return stop(topicId, serverId)
  }
  async function update(data: MCPServerParam) {
    return api.update(data)
  }
  async function getAll() {
    return api.getAll()
  }
  async function init() {
    window.api.bus.on(EventKey.MCPStatus, async data => {
      // console.log("[MCPStatus]", data)
      const server = findServer(data.id)
      if (!server) return
      const status = data.status
      server.status = status
      server.referTopics = data.refs
      queue.add(async () => api.update(clonePure(server)))
      fetchTools(server.id)
    })
    servers.length = 0
    const data = await api.fetch()
    servers.push(...data)
  }
  return {
    init,

    servers,
    fetchTools,
    remove,
    restart,
    start,
    stop,
    clonePure,
    createNewId,
    findServer,
    add,
    bulkAdd,
    getAll,
    update,
  }
})
