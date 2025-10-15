import { ModelMeta } from "@renderer/types"
import { db } from "@renderer/db"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"

export const useData = () => {
  const queue = markRaw(new PQueue({ concurrency: 1 }))
  const update = async (data: ModelMeta) => queue.add(async () => db.model.put(cloneDeep(data)))
  const add = async (data: ModelMeta) => queue.add(async () => db.model.add(cloneDeep(data)))
  async function refresh(newModels: ModelMeta[]) {
    await db.model.bulkPut(newModels)
    await fetch()
  }
  async function find(modelId?: string) {
    if (!modelId) return
    return db.model.get(modelId)
  }

  const fetch = async () => {
    return db.model.toArray()
  }
  return {
    fetch,
    update,
    add,
    find,
    refresh,
  }
}
