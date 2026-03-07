import { ProviderMeta, QueryParams } from "@windai/core/types"
import { cloneDeep } from "@toolmain/shared"
import { useDBQueue } from "@windai/core/storage"

const queue = useDBQueue()
export async function put(data: ProviderMeta, params?: QueryParams) {
  return queue.add(db => db.providerMeta.put(cloneDeep(data)), params)
}
export async function add(data: ProviderMeta, params?: QueryParams) {
  return queue.add(db => db.providerMeta.add(cloneDeep(data)), params)
}
export async function clear(params?: QueryParams) {
  return queue.add(db => db.providerMeta.clear(), params)
}
export async function bulkGet(providerNames: string[], params?: QueryParams) {
  return queue.add(db => db.providerMeta.bulkGet(providerNames), params)
}
export async function get(providerName: string, params?: QueryParams) {
  return queue.add(db => db.providerMeta.get(providerName), params)
}
export async function fetch() {
  return queue.add(db => db.providerMeta.toArray())
}
