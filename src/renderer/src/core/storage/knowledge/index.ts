import { Knowledge, QueryParams } from "../../types"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { resolveDb } from "../utils"

const queue = new PQueue({ concurrency: 1 })
export async function put(data: Knowledge, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).knowledge.put(cloneDeep(data)))
}
export async function add(data: Knowledge, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).knowledge.add(cloneDeep(data)))
}
export async function get(id: string, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).knowledge.get(id))
}
export async function gets(ids: string[], params?: QueryParams) {
  return queue.add(async () => resolveDb(params).knowledge.bulkGet(ids))
}
export async function findByEmbeddingId(embeddingId: string, params?: QueryParams): Promise<Knowledge[]> {
  return queue.add(async () => resolveDb(params).knowledge.where("embeddingId").equals(embeddingId).toArray())
}
export async function fetch(params?: QueryParams) {
  return queue.add(async () => resolveDb(params).knowledge.toArray())
}
