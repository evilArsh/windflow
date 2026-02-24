import { QueryParams } from "@windflow/core/types"
import { RAGEmbeddingConfig } from "@windflow/shared"
import { cloneDeep } from "@toolmain/shared"
import { useDBQueue } from "@windflow/core/storage"

const queue = useDBQueue()
export async function put(data: RAGEmbeddingConfig, params?: QueryParams) {
  return queue.add(db => db.embedding.put(cloneDeep(data)), params)
}
export async function add(data: RAGEmbeddingConfig, params?: QueryParams) {
  return queue.add(db => db.embedding.add(cloneDeep(data)), params)
}
export async function remove(embeddingId: string, params?: QueryParams) {
  return queue.add(db => db.embedding.delete(embeddingId), params)
}
export async function get(id: string, params?: QueryParams) {
  return queue.add(db => db.embedding.get(id), params)
}
export async function gets(ids: string[], params?: QueryParams) {
  return queue.add(db => db.embedding.bulkGet(ids), params)
}
export async function fetch() {
  return queue.add(db => db.embedding.toArray())
}
