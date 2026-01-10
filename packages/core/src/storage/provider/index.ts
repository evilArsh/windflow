import { ProviderMeta, QueryParams } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { resolveDb } from "../utils"
import { db } from "../index"

const queue = new PQueue({ concurrency: 1 })
export async function put(data: ProviderMeta, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).providerMeta.put(cloneDeep(data)))
}
export async function add(data: ProviderMeta, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).providerMeta.add(cloneDeep(data)))
}
export async function clear(params?: QueryParams) {
  return queue.add(async () => resolveDb(params).providerMeta.clear())
}
export async function bulkGet(providerNames: string[]) {
  return queue.add(async () => db.providerMeta.bulkGet(providerNames))
}
export async function get(providerName: string) {
  return queue.add(async () => db.providerMeta.get(providerName))
}
export async function fetch() {
  return queue.add(async () => db.providerMeta.toArray())
}
