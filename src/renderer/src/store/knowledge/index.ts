import { defineStore } from "pinia"
import { Knowledge } from "@renderer/types/knowledge"
import { useData } from "./api"
import useRagFilesStore from "../ragFiles/index"
import { db } from "@renderer/db"
import { cloneDeep, code5xx } from "@toolmain/shared"
export default defineStore("knowledge", () => {
  const ragFilesStore = useRagFilesStore()
  const knowledges = reactive<Knowledge[]>([])
  const api = useData()
  /**
   * remove knowledge and all contents related to it
   */
  async function remove(knowledgeId: string) {
    return db.transaction("rw", db.knowledge, db.ragFiles, async trans => {
      trans.knowledge.delete(knowledgeId)
      trans.ragFiles.where("topicId").equals(knowledgeId).delete()
      ragFilesStore.removeFilesByTopicId(knowledgeId)
      const i = knowledges.findIndex(item => item.id === knowledgeId)
      if (i >= 0) {
        knowledges.splice(i, 1)
      }
      if (window.api) {
        const res = await window.api.rag.removeByTopicId(knowledgeId)
        if (code5xx(res.code)) {
          throw new Error(res.msg)
        }
      }
    })
  }
  async function findByEmbeddingId(embedding: string) {
    return api.findByEmbeddingId(embedding)
  }
  async function update(data: Knowledge) {
    return api.update(data)
  }
  async function add(data: Knowledge) {
    await api.add(data)
    knowledges.push(cloneDeep(data))
  }
  /**
   * initiallly get knowledge data when application started
   */
  async function init() {
    knowledges.length = 0
    const data = await api.fetch()
    data.forEach(item => {
      knowledges.push(item)
    })
  }
  return {
    init,
    knowledges,
    remove,
    findByEmbeddingId,
    update,
    add,
  }
})
