import { defineStore } from "pinia"
import { RAGLocalFileInfo } from "@windflow/shared"
import { storage } from "@windflow/core/storage"
export default defineStore("ragFiles", () => {
  const ragFiles = reactive<Record<string, RAGLocalFileInfo[]>>({}) // knowledge_base as key
  /**
   * remove ragFile by `id`
   */
  async function remove(id: string) {
    const data = await storage.ragFiles.get(id)
    if (!data) return
    const kb = ragFiles[data.topicId]
    if (!kb) return
    await window.api.rag.removeById(data.topicId, id)
    await storage.ragFiles.remove(id)
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
    const data = await storage.ragFiles.getAllByTopicId(topicId)
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
    await storage.ragFiles.add(data)
    addToCache(data)
  }
  async function bulkAdd(datas: RAGLocalFileInfo[]) {
    await storage.ragFiles.bulkAdd(datas)
    datas.forEach(addToCache)
  }
  async function get(topicId: string, id: string) {
    const files = ragFiles[topicId]
    if (!files) return
    return files.find(file => file.id === id)
  }
  async function update(info: RAGLocalFileInfo) {
    return storage.ragFiles.put(info)
  }
  async function fileExist(topicId: string, filePath: string): Promise<boolean> {
    return storage.ragFiles.fileExist(topicId, filePath)
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
