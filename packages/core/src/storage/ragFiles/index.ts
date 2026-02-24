import { QueryParams } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import { RAGLocalFileInfo } from "@windflow/shared"
import { useDBQueue } from "@windflow/core/storage"

const queue = useDBQueue()
export async function put(data: RAGLocalFileInfo, params?: QueryParams) {
  return queue.add(db => db.ragFiles.put(cloneDeep(data)), params)
}
export async function add(data: RAGLocalFileInfo, params?: QueryParams) {
  return queue.add(db => db.ragFiles.add(cloneDeep(data)), params)
}
export async function bulkAdd(datas: RAGLocalFileInfo[], params?: QueryParams) {
  return queue.add(db => db.ragFiles.bulkAdd(cloneDeep(datas)), params)
}
export async function remove(id: string, params?: QueryParams) {
  return queue.add(db => db.ragFiles.delete(id), params)
}
export async function removeByTopicId(topicId: string, params?: QueryParams) {
  return queue.add(db => db.ragFiles.where("topicId").equals(topicId).delete(), params)
}
export async function get(id: string, params?: QueryParams) {
  return queue.add(db => db.ragFiles.get(id), params)
}
export async function getAllByTopicId(topicId: string, params?: QueryParams) {
  return queue.add(
    db =>
      db.ragFiles
        .where({
          topicId,
        })
        .toArray(),
    params
  )
}
export async function fileExist(topicId: string, filePath: string, params?: QueryParams) {
  return queue.add(async db => {
    const count = await db.ragFiles
      .where({
        topicId,
        path: filePath,
      })
      .count()
    return count > 0
  }, params)
}
