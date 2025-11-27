import { db } from "@renderer/db"
import { Knowledge } from "@renderer/types/knowledge"
import { cloneDeep } from "@toolmain/shared"

export const useData = () => {
  const update = async (data: Knowledge) => db.knowledge.put(cloneDeep(data))
  const add = async (data: Knowledge) => db.knowledge.add(cloneDeep(data))
  const get = async (id: string) => db.knowledge.get(id)
  const gets = async (ids: string[]) => await db.knowledge.bulkGet(ids)
  const findByEmbeddingId = async (embeddingId: string): Promise<Knowledge[]> => {
    return await db.knowledge.where("embeddingId").equals(embeddingId).toArray()
  }
  const fetch = async () => {
    return await db.knowledge.toArray()
  }
  return {
    fetch,
    update,
    add,
    get,
    gets,
    findByEmbeddingId,
  }
}
