import { Knowledge, QueryParams } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { resolveDb } from "../utils"
import { db } from "../index"

const queue = new PQueue({ concurrency: 1 })
export async function put(data: Knowledge, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).knowledge.put(cloneDeep(data)))
}
export async function add(data: Knowledge, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).knowledge.add(cloneDeep(data)))
}
export async function get(id: string) {
  return queue.add(async () => db.knowledge.get(id))
}
export async function gets(ids: string[]) {
  return queue.add(async () => db.knowledge.bulkGet(ids))
}
export async function remove(knowlwdgeId: string, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).knowledge.delete(knowlwdgeId))
}
export async function findByEmbeddingId(embeddingId: string): Promise<Knowledge[]> {
  return queue.add(async () => db.knowledge.where("embeddingId").equals(embeddingId).toArray())
}
export async function fetch() {
  return queue.add(async () => db.knowledge.toArray())
}
