import { db } from "@renderer/db"
import { RAGLocalFileInfo } from "@shared/types/rag"
import { cloneDeep } from "@toolmain/shared"
export const useData = () => {
  const update = async (data: RAGLocalFileInfo) => db.ragFiles.put(cloneDeep(data))
  const add = async (data: RAGLocalFileInfo) => db.ragFiles.add(cloneDeep(data))
  const remove = async (id: string) => db.ragFiles.delete(id)
  const get = async (id: string) => db.ragFiles.get(id)
  /**
   * 删除指定知识库topic下的文件
   */
  const removeAllByTopicId = async (topicId: string) => db.ragFiles.where("topicId").equals(topicId).delete()
  const getAllByTopicId = async (topicId: string) => db.ragFiles.where("topicId").equals(topicId).toArray()

  return {
    update,
    add,
    get,
    remove,
    removeAllByTopicId,
    getAllByTopicId,
  }
}
