import { defineStore } from "pinia"
import { useData } from "./api"
import { RAGEmbeddingConfig } from "@shared/types/rag"
export default defineStore("embedding", () => {
  const embeddings = reactive<RAGEmbeddingConfig[]>([])
  const api = useData()

  async function remove(embeddingId: string) {
    await api.remove(embeddingId)
    const i = embeddings.findIndex(item => item.id === embeddingId)
    if (i < 0) return
    embeddings.splice(i, 1)
  }
  async function init() {
    embeddings.length = 0
    const data = await api.fetch()
    embeddings.push(...data)
  }
  return {
    init,
    api,

    embeddings,
    remove,
  }
})
