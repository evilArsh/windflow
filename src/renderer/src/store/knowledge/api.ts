import { db } from "@renderer/db"
import { Knowledge } from "@renderer/types/knowledge"
import { cloneDeep } from "@toolmain/shared"

export const useData = () => {
  const update = async (data: Knowledge) => db.knowledge.put(cloneDeep(data))
  const add = async (data: Knowledge) => db.knowledge.add(cloneDeep(data))
  const remove = async (id: string) => db.knowledge.delete(id)
  const fetch = async () => {
    return await db.knowledge.toArray()
  }
  return {
    fetch,
    update,
    add,
    remove,
  }
}
