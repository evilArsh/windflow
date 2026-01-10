import { QueryParams } from "@windflow/core/types"
import { RAGEmbeddingConfig } from "@windflow/shared"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { resolveDb } from "../utils"
import { db } from "../index"

const queue = new PQueue({ concurrency: 1 })
export async function put(data: RAGEmbeddingConfig, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).embedding.put(cloneDeep(data)))
}
export async function add(data: RAGEmbeddingConfig, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).embedding.add(cloneDeep(data)))
}
export async function remove(embeddingId: string, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).embedding.delete(embeddingId))
}
export async function get(id: string) {
  return queue.add(async () => db.embedding.get(id))
}
export async function gets(ids: string[]) {
  return queue.add(async () => db.embedding.bulkGet(ids))
}
export async function fetch() {
  return queue.add(async () => db.embedding.toArray())
}
