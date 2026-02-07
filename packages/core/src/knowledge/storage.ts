import { storage, withTransaction } from "@windflow/core/storage"
import { RAGEmbeddingConfig, RAGLocalFileInfo } from "@windflow/shared"
import { Knowledge } from "@windflow/core/types"
import Dexie from "dexie"
export class KnowledgeStorage {
  async remove(knowledgeId: string) {
    return withTransaction("rw", ["knowledge", "ragFiles"], async tx => {
      await Dexie.Promise.all([
        storage.knowledge.remove(knowledgeId, { transaction: tx }),
        storage.ragFiles.removeByTopicId(knowledgeId, { transaction: tx }),
      ])
    })
  }
  async findByEmbeddingId(embeddingId: string) {
    return storage.knowledge.findByEmbeddingId(embeddingId)
  }
  async put(data: Knowledge) {
    return storage.knowledge.put(data)
  }
  async add(data: Knowledge) {
    return storage.knowledge.add(data)
  }
  async get(knowledgeId: string) {
    return storage.knowledge.get(knowledgeId)
  }
  async fetch() {
    return storage.knowledge.fetch()
  }
}
export class EmbeddingStorage {
  async remove(embeddingId: string) {
    return storage.embedding.remove(embeddingId)
  }
  async put(data: RAGEmbeddingConfig) {
    return storage.embedding.put(data)
  }
  async get(embeddingId: string) {
    return storage.embedding.get(embeddingId)
  }
  async gets(embeddingIds: string[]) {
    return storage.embedding.gets(embeddingIds)
  }
  async add(data: RAGEmbeddingConfig) {
    return storage.embedding.add(data)
  }
  async fetch() {
    return storage.embedding.fetch()
  }
}
export class RagFileStorage {
  async get(ragFileId: string) {
    return storage.ragFiles.get(ragFileId)
  }
  async remove(ragFileId: string) {
    return storage.ragFiles.remove(ragFileId)
  }
  async getAllByTopicId(topicId: string) {
    return storage.ragFiles.getAllByTopicId(topicId)
  }
  async add(data: RAGLocalFileInfo) {
    return storage.ragFiles.add(data)
  }
  async bulkAdd(data: RAGLocalFileInfo[]) {
    return storage.ragFiles.bulkAdd(data)
  }
  async put(data: RAGLocalFileInfo) {
    return storage.ragFiles.put(data)
  }
  async fileExist(topicId: string, filePath: string) {
    return storage.ragFiles.fileExist(topicId, filePath)
  }
}
