import { Knowledge, QueryParams } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import { useDBQueue } from "@windflow/core/storage"

const queue = useDBQueue()
export async function put(data: Knowledge, params?: QueryParams) {
  return queue.add(db => db.knowledge.put(cloneDeep(data)), params)
}
export async function add(data: Knowledge, params?: QueryParams) {
  return queue.add(db => db.knowledge.add(cloneDeep(data)), params)
}
export async function get(id: string, params?: QueryParams) {
  return queue.add(db => db.knowledge.get(id), params)
}
export async function gets(ids: string[], params?: QueryParams) {
  return queue.add(db => db.knowledge.bulkGet(ids), params)
}
export async function remove(knowlwdgeId: string, params?: QueryParams) {
  return queue.add(db => db.knowledge.delete(knowlwdgeId), params)
}
export async function findByEmbeddingId(embeddingId: string, params?: QueryParams): Promise<Knowledge[]> {
  return queue.add(db => db.knowledge.where("embeddingId").equals(embeddingId).toArray(), params)
}
export async function fetch() {
  return queue.add(db => db.knowledge.toArray())
}
