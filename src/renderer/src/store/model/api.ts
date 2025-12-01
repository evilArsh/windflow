import { ModelMeta } from "@renderer/types"
import { db } from "@renderer/db"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { UpdateSpec } from "dexie"

export const useData = () => {
  const queue = markRaw(new PQueue({ concurrency: 1 }))
  const put = async (data: ModelMeta) => queue.add(async () => db.model.put(cloneDeep(data)))
  const add = async (data: ModelMeta) => queue.add(async () => db.model.add(cloneDeep(data)))
  const bulkPut = async (newModels: ModelMeta[]) => queue.add(async () => db.model.bulkPut(newModels))
  const bulkUpdate = async (
    keysAndChanges: ReadonlyArray<{
      key: string
      changes: UpdateSpec<ModelMeta>
    }>
  ) => queue.add(async () => db.model.bulkUpdate(keysAndChanges))
  async function find(modelId?: string) {
    if (!modelId) return
    return db.model.get(modelId)
  }

  const fetch = async () => {
    return db.model.toArray()
  }
  return {
    fetch,
    put,
    add,
    find,
    bulkPut,
    bulkUpdate,
  }
}
