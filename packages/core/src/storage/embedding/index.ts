import { QueryParams } from "@windflow/core/types"
import { RAGEmbeddingConfig } from "@windflow/shared/types"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { resolveDb } from "../utils"

const queue = new PQueue({ concurrency: 1 })
export async function put(data: RAGEmbeddingConfig, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).embedding.put(cloneDeep(data)))
}
export async function add(data: RAGEmbeddingConfig, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).embedding.add(cloneDeep(data)))
}
export async function remove(id: string, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).embedding.delete(id))
}
export async function get(id: string, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).embedding.get(id))
}
export async function gets(ids: string[], params?: QueryParams) {
  return queue.add(async () => resolveDb(params).embedding.bulkGet(ids))
}
export async function fetch(params?: QueryParams) {
  return queue.add(async () => resolveDb(params).embedding.toArray())
}
