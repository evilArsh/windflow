import { db } from "@renderer/db"
import { RAGLocalFileInfo } from "@shared/types/rag"
import { cloneDeep } from "@toolmain/shared"
export const useData = () => {
  const update = async (data: RAGLocalFileInfo) => db.ragFiles.put(cloneDeep(data))
  const add = async (data: RAGLocalFileInfo) => db.ragFiles.add(cloneDeep(data))
  const bulkAdd = async (datas: RAGLocalFileInfo[]) => db.ragFiles.bulkAdd(cloneDeep(datas))

  const remove = async (id: string) => db.ragFiles.delete(id)
  const get = async (id: string) => db.ragFiles.get(id)
  const getAllByTopicId = async (topicId: string) => db.ragFiles.where("topicId").equals(topicId).toArray()

  return {
    update,
    add,
    get,
    remove,
    getAllByTopicId,
    bulkAdd,
  }
}
