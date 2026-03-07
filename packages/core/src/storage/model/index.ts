import { ModelMeta, QueryParams } from "@windai/core/types"
import { cloneDeep } from "@toolmain/shared"
import { UpdateSpec } from "dexie"
import { useDBQueue } from "@windai/core/storage"

const queue = useDBQueue()

export async function put(data: ModelMeta, params?: QueryParams) {
  return queue.add(db => db.model.put(cloneDeep(data)), params)
}
export async function add(data: ModelMeta, params?: QueryParams) {
  return queue.add(db => db.model.add(cloneDeep(data)), params)
}
export async function bulkPut(newModels: ModelMeta[], params?: QueryParams) {
  return queue.add(db => db.model.bulkPut(newModels), params)
}
export async function bulkUpdate(
  keysAndChanges: ReadonlyArray<{
    key: string
    changes: UpdateSpec<ModelMeta>
  }>,
  params?: QueryParams
) {
  return queue.add(db => db.model.bulkUpdate(keysAndChanges), params)
}
export async function get(modelId: string, params?: QueryParams) {
  return queue.add(db => db.model.get(modelId), params)
}
/**
 * retrive the top N most frequently used models
 */
export async function getMostFrequentTops(top: number, params?: QueryParams) {
  return queue.add(db => db.model.orderBy("frequency").reverse().limit(top).toArray(), params)
}
export async function bulkGet(modelIds: string[], params?: QueryParams) {
  return queue.add(db => db.model.bulkGet(modelIds), params)
}
export async function anyOf(modelIds: string[], params?: QueryParams) {
  return queue.add(db => db.model.where("id").anyOf(modelIds).toArray(), params)
}
export async function fetch() {
  return queue.add(db => db.model.toArray())
}
