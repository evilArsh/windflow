import { defineStore } from "pinia"
import { useData } from "./api"
import { RAGLocalFileInfo } from "@shared/types/rag"
export default defineStore("ragFiles", () => {
  const ragFiles = reactive<Record<string, RAGLocalFileInfo[]>>({})
  const api = useData()
  /**
   * remove ragFile by `id`
   */
  async function remove(id: string) {
    const data = await api.get(id)
    if (!data) return
    const kb = ragFiles[data.topicId]
    if (!kb) return
    await api.remove(id)
    const i = kb.findIndex(item => item.id === id)
    if (i < 0) return
    kb.splice(i, 1)
  }
  /**
   * remove `ragFiles` caches by `topicId`
   */
  function removeFilesByTopicId(topicId: string) {
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
  async function add(data: RAGLocalFileInfo) {
    return api.add(data)
  }

  return {
    ragFiles,
    remove,
    removeFilesByTopicId,
    fetchAllByTopicId,
    add,
  }
})
