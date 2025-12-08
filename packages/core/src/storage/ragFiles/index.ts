import { QueryParams } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { resolveDb } from "../utils"
import { RAGLocalFileInfo } from "@windflow/shared/types"

const queue = new PQueue({ concurrency: 1 })
export async function put(data: RAGLocalFileInfo, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).ragFiles.put(cloneDeep(data)))
}
export async function add(data: RAGLocalFileInfo, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).ragFiles.add(cloneDeep(data)))
}
export async function bulkAdd(datas: RAGLocalFileInfo[], params?: QueryParams) {
  return queue.add(async () => resolveDb(params).ragFiles.bulkAdd(cloneDeep(datas)))
}
export async function remove(id: string, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).ragFiles.delete(id))
}
export async function get(id: string, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).ragFiles.get(id))
}
export async function getAllByTopicId(topicId: string, params?: QueryParams) {
  return queue.add(async () =>
    resolveDb(params)
      .ragFiles.where({
        topicId,
      })
      .toArray()
  )
}
export async function fileExist(topicId: string, filePath: string, params?: QueryParams) {
  return queue.add(async () => {
    const count = await resolveDb(params)
      .ragFiles.where({
        topicId,
        path: filePath,
      })
      .count()
    return count > 0
  })
}
