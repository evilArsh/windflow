import { defineStore } from "pinia"
import { RAGEmbeddingConfig } from "@windflow/shared"
import { cloneDeep, isUndefined } from "@toolmain/shared"
import { useKnowledge } from "@renderer/hooks/useCore"
export default defineStore("embedding", () => {
  const embeddings = reactive<RAGEmbeddingConfig[]>([])
  const kbMgr = useKnowledge()
  const storage = kbMgr.getEmbeddingStorage()
  async function remove(embeddingId: string) {
    await storage.remove(embeddingId)
    const i = embeddings.findIndex(item => item.id === embeddingId)
    if (i < 0) return
    embeddings.splice(i, 1)
  }
  async function update(data: RAGEmbeddingConfig) {
    return storage.put(data)
  }
  async function add(data: RAGEmbeddingConfig) {
    await storage.add(data)
    embeddings.push(cloneDeep(data))
  }
  async function get(embeddingId: string) {
    const cache = embeddings.find(item => item.id === embeddingId)
    if (cache) return cache
    return storage.get(embeddingId)
  }
  async function gets(embeddingIds: string[]): Promise<Array<RAGEmbeddingConfig>> {
    const cache = embeddings.filter(item => embeddingIds.includes(item.id))
    if (cache.length !== embeddingIds.length) {
      return (await storage.gets(embeddingIds)).filter(v => !isUndefined(v))
    }
    return cache
  }
  async function init() {
    embeddings.length = 0
    const data = await storage.fetch()
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
