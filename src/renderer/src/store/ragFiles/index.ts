import { defineStore } from "pinia"
import { useData } from "./api"
import { RAGLocalFileMeta } from "@shared/types/rag"
export default defineStore("ragFiles", () => {
  const ragFiles = reactive<Record<string, RAGLocalFileMeta[]>>({})
  const api = useData()
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
  async function removeAllByTopicId(topicId: string) {
    // TODO: delete vector database record
    await api.removeAllByTopicId(topicId)
    if (Object.hasOwn(ragFiles, topicId)) {
      ragFiles[topicId] = []
    }
  }
  async function fetchAllByTopicId(topicId: string) {
    const data = await api.getAllByTopicId(topicId)
    ragFiles[topicId] = data
    return ragFiles[topicId]
  }

  return {
    api,

    ragFiles,
    removeAllByTopicId,
    remove,
    fetchAllByTopicId,
  }
})
