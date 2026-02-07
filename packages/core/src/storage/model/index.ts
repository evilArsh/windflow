import { ModelMeta, QueryParams } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { UpdateSpec } from "dexie"
import { resolveDb } from "../utils"
import { db } from "../index"

const queue = new PQueue({ concurrency: 1 })

export async function put(data: ModelMeta, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).model.put(cloneDeep(data)))
}
export async function add(data: ModelMeta, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).model.add(cloneDeep(data)))
}
export async function bulkPut(newModels: ModelMeta[], params?: QueryParams) {
  return queue.add(async () => resolveDb(params).model.bulkPut(newModels))
}
export async function bulkUpdate(
  keysAndChanges: ReadonlyArray<{
    key: string
    changes: UpdateSpec<ModelMeta>
  }>,
  params?: QueryParams
) {
  return queue.add(async () => resolveDb(params).model.bulkUpdate(keysAndChanges))
}
export async function get(modelId: string) {
  return queue.add(async () => db.model.get(modelId))
}
/**
 * retrive the top N most frequently used models
 */
export async function getMostFrequentTops(top: number) {
  return queue.add(async () => db.model.orderBy("frequency").reverse().limit(top).toArray())
}
export async function bulkGet(modelIds: string[]) {
  return queue.add(async () => db.model.bulkGet(modelIds))
}
export async function anyOf(modelIds: string[]) {
  return queue.add(async () => db.model.where("id").anyOf(modelIds).toArray())
}
export async function fetch() {
  return queue.add(async () => db.model.toArray())
}
