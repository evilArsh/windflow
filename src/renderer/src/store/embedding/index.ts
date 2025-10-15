import { defineStore } from "pinia"
import { useData } from "./api"
import { RAGEmbeddingConfig } from "@shared/types/rag"
export default defineStore("knowledge", () => {
  const embeddings = reactive<RAGEmbeddingConfig[]>([])
  const api = useData()

  async function remove(id: string) {
    await api.remove(id)
    const i = embeddings.findIndex(item => item.id === id)
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
