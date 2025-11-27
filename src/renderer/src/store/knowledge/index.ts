import { defineStore } from "pinia"
import { Knowledge, KnowledgeEmbeddingPair } from "@renderer/types/knowledge"
import { useData } from "./api"
import useRagFilesStore from "../ragFiles/index"
import useEmbeddingStore from "@renderer/store/embedding"
import { db } from "@renderer/db"
import { cloneDeep, code5xx, isUndefined, msgError, uniqueId } from "@toolmain/shared"
import { EventKey } from "@shared/types/eventbus"
import { RAGEmbeddingConfig, RAGFileStatus, RAGLocalFileInfo } from "@shared/types/rag"
export default defineStore("knowledge", () => {
  const ragFilesStore = useRagFilesStore()
  const embeddingStore = useEmbeddingStore()

  const knowledges = reactive<Knowledge[]>([])
  const { t } = useI18n()
  const api = useData()
  /**
   * remove knowledge and all contents related to it
   */
  async function remove(knowledgeId: string) {
    await db.transaction("rw", db.knowledge, db.ragFiles, async trans => {
      await trans.knowledge.delete(knowledgeId)
      await trans.ragFiles.where("topicId").equals(knowledgeId).delete()
    })
    if (window.api) {
      const res = await window.api.rag.removeByTopicId(knowledgeId)
      if (code5xx(res.code)) {
        throw new Error(res.msg)
      }
    }
    const i = knowledges.findIndex(item => item.id === knowledgeId)
    if (i >= 0) {
      knowledges.splice(i, 1)
    }
    ragFilesStore.removeCacheFilesByTopicId(knowledgeId)
  }
  /**
   * find all knowledges which using `embedding`
   */
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
  async function get(knowledgeId: string) {
    const knowledge = knowledges.find(item => item.id === knowledgeId)
    return knowledge ?? (await api.get(knowledgeId))
  }
  async function gets(knowledgeIds: string[]): Promise<Array<Knowledge>> {
    const knowledge = knowledges.filter(item => knowledgeIds.includes(item.id))
    if (knowledge.length !== knowledgeIds.length) return (await api.gets(knowledgeIds)).filter(v => !isUndefined(v))
    return knowledge
  }
  /**
   * find embedding config which was binded by `knowledgeId`
   */
  async function getEmbeddingConfigById(knowledgeId: string): Promise<RAGEmbeddingConfig | undefined> {
    const kb = await get(knowledgeId)
    if (kb?.embeddingId) {
      return embeddingStore.get(kb.embeddingId)
    }
    return
  }
  async function getEmbeddingConfigByIds(knowledgeIds: string[]): Promise<KnowledgeEmbeddingPair[]> {
    const kbs = await gets(knowledgeIds)
    const availableKbs = kbs.filter(kb => !isUndefined(kb.embeddingId))
    const res = await embeddingStore.gets(availableKbs.map(kb => kb.embeddingId!))
    if (knowledgeIds.length !== res.length) {
      console.warn("[getEmbeddingConfigByIds] mismatch length bwetween knowledgeIds and embeddingConfigs")
    }
    return res
      .map(embeddingConfig => {
        const kb = availableKbs.find(kb => kb.embeddingId === embeddingConfig.id)
        return !isUndefined(kb)
          ? {
              knowledgeId: kb.id,
              embeddingConfig,
            }
          : undefined
      })
      .filter(r => !!r)
  }
  async function processFiles(filePaths: string[], knowledge: Knowledge) {
    if (!knowledge.embeddingId) {
      msgError(t("knowledge.emptyEmbeddingId"))
      return
    }
    const embd = await embeddingStore.get(knowledge.embeddingId)
    if (!embd) {
      msgError(t("knowledge.embeddingNotFound"))
      return
    }
    const infos = await window.api.file.getInfo(filePaths)
    if (infos.data.length) {
      const datas: RAGLocalFileInfo[] = []
      for (const info of infos.data) {
        if (!info.isFile) continue
        if (await ragFilesStore.fileExist(knowledge.id, info.path)) continue
        const item: RAGLocalFileInfo = {
          id: uniqueId(),
          path: info.path,
          topicId: knowledge.id,
          fileName: info.name,
          fileSize: info.size,
          mimeType: info.mimeType,
          extension: info.extension,
          status: RAGFileStatus.Processing,
        }
        datas.push(item)
      }
      await ragFilesStore.bulkAdd(datas)
      datas.forEach(data => {
        window.api.rag.processLocalFile(data, cloneDeep(embd))
      })
    }
  }
  /**
   * find next knowledge data near `knowledgeId` in cache data
   */
  function findNextSibling(knowledgeId: string) {
    let current = knowledges.findIndex(item => item.id === knowledgeId)
    current = current < 0 ? 0 : current + 1 >= knowledges.length ? current - 1 : current + 1
    if (current < 0 || current >= knowledges.length) {
      return
    }
    return knowledges[current]
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
    window.api.bus.on(EventKey.RAGFileProcessStatus, async data => {
      const file = await ragFilesStore.get(data.topicId, data.id)
      if (!file) return
      file.status = data.status
      file.code = data.code
      file.msg = file.status === RAGFileStatus.Success ? "" : data.msg
      await ragFilesStore.update(file)
    })
  }
  return {
    init,
    knowledges,
    remove,
    findByEmbeddingId,
    getEmbeddingConfigById,
    getEmbeddingConfigByIds,
    update,
    add,
    get,
    processFiles,
    findNextSibling,
  }
})
