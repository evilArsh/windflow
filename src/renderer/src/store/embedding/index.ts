import { defineStore } from "pinia"
import { useData } from "./api"
import { RAGEmbeddingConfig } from "@shared/types/rag"
import { cloneDeep, isUndefined } from "@toolmain/shared"
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
  async function get(embeddingId: string) {
    const cache = embeddings.find(item => item.id === embeddingId)
    if (cache) return cache
    return api.get(embeddingId)
  }
  async function gets(embeddingIds: string[]): Promise<Array<RAGEmbeddingConfig>> {
    const cache = embeddings.filter(item => embeddingIds.includes(item.id))
    if (cache.length !== embeddingIds.length) return (await api.gets(embeddingIds)).filter(v => !isUndefined(v))
    return cache
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
    gets,
  }
})
