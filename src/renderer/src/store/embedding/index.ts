import { defineStore } from "pinia"
import { useData } from "./api"
import { RAGEmbeddingConfig } from "@shared/types/rag"
import { cloneDeep } from "@toolmain/shared"
export default defineStore("embedding", () => {
  const embeddings = reactive<RAGEmbeddingConfig[]>([])
  const api = useData()

  async function remove(embeddingId: string) {
    await api.remove(embeddingId)
    const i = embeddings.findIndex(item => item.id === embeddingId)
    if (i < 0) return
    embeddings.splice(i, 1)
  }
  async function update(data: RAGEmbeddingConfig) {
    return api.update(data)
  }
  async function add(data: RAGEmbeddingConfig) {
    await api.add(data)
    embeddings.push(cloneDeep(data))
  }
  async function get(id: string) {
    const cache = embeddings.find(item => item.id === id)
    if (cache) return cache
    return api.get(id)
  }
  async function init() {
    embeddings.length = 0
    const data = await api.fetch()
    embeddings.push(...data)
  }
  return {
    init,
    embeddings,
    remove,
    update,
    add,
    get,
  }
})
