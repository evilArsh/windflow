import { defineStore } from "pinia"
import { useData } from "./api"
import { RAGLocalFileInfo } from "@shared/types/rag"
export default defineStore("ragFiles", () => {
  const ragFiles = reactive<Record<string, RAGLocalFileInfo[]>>({}) // knowledge_base as key
  const api = useData()
  /**
   * remove ragFile by `id`
   */
  async function remove(id: string) {
    const data = await api.get(id)
    if (!data) return
    const kb = ragFiles[data.topicId]
    if (!kb) return
    await window.api.rag.removeById(data.topicId, id)
    await api.remove(id)
    const i = kb.findIndex(item => item.id === id)
    if (i < 0) return
    kb.splice(i, 1)
  }
  /**
   * remove `ragFiles` caches by `topicId`
   */
  function removeCacheFilesByTopicId(topicId: string) {
    if (Object.hasOwn(ragFiles, topicId)) {
      ragFiles[topicId] = []
    }
  }
  /**
   * fetch ragFiles from db by `topicId`
   */
  async function fetchAllByTopicId(topicId: string) {
    const data = await api.getAllByTopicId(topicId)
    ragFiles[topicId] = data
    return ragFiles[topicId]
  }
  function addToCache(data: RAGLocalFileInfo) {
    if (!ragFiles[data.topicId]) {
      ragFiles[data.topicId] = []
    }
    ragFiles[data.topicId].push(data)
  }
  async function add(data: RAGLocalFileInfo) {
    await api.add(data)
    addToCache(data)
  }
  async function bulkAdd(datas: RAGLocalFileInfo[]) {
    await api.bulkAdd(datas)
    datas.forEach(addToCache)
  }
  async function get(topicId: string, id: string) {
    const files = ragFiles[topicId]
    if (!files) return
    return files.find(file => file.id === id)
  }
  async function update(info: RAGLocalFileInfo) {
    return api.update(info)
  }
  async function fileExist(topicId: string, filePath: string): Promise<boolean> {
    return api.fileExist(topicId, filePath)
  }

  return {
    ragFiles,
    remove,
    removeCacheFilesByTopicId,
    fetchAllByTopicId,
    add,
    fileExist,
    addToCache,
    bulkAdd,
    get,
    update,
  }
})
