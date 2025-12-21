import { ModelMeta, QueryParams } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { UpdateSpec } from "dexie"
import { resolveDb } from "../utils"

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
export async function get(modelId?: string, params?: QueryParams) {
  if (!modelId) return
  return queue.add(async () => resolveDb(params).model.get(modelId))
}
export async function bulkGet(modelIds: string[], params?: QueryParams) {
  return queue.add(async () => resolveDb(params).model.bulkGet(modelIds))
}
export async function fetch(params?: QueryParams) {
  return queue.add(async () => resolveDb(params).model.toArray())
}
