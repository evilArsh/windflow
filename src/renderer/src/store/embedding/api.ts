import { db } from "@renderer/db"
import { RAGEmbeddingConfig } from "@shared/types/rag"
import { cloneDeep } from "@toolmain/shared"
export const useData = () => {
  const update = async (data: RAGEmbeddingConfig) => db.embedding.put(cloneDeep(data))
  const add = async (data: RAGEmbeddingConfig) => db.embedding.add(cloneDeep(data))
  const remove = async (id: string) => db.embedding.delete(id)
  const get = async (id: string) => db.embedding.get(id)

  async function fetch() {
    return await db.embedding.toArray()
  }

  return {
    fetch,

    update,
    add,
    get,
    remove,
  }
}
