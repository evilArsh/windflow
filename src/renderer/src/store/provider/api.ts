import { ProviderMeta } from "@renderer/types"
import { db } from "@renderer/db"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"

export const useData = () => {
  const queue = markRaw(new PQueue({ concurrency: 1 }))

  const update = async (data: ProviderMeta) => queue.add(async () => db.providerMeta.put(cloneDeep(data)))
  const add = async (data: ProviderMeta) => queue.add(async () => db.providerMeta.add(cloneDeep(data)))
  const clear = async () => db.providerMeta.clear()

  const fetch = async () => {
    return await db.providerMeta.toArray()
  }

  return {
    fetch,
    update,
    add,
    clear,
  }
}
