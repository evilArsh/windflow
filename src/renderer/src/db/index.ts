import {
  ProviderMeta,
  ModelMeta,
  ChatTopic,
  ChatMessage,
  Settings,
  SettingsValue,
  ChatLLMConfig,
  ChatTTIConfig,
} from "@renderer/types"
import { MCPServerParam } from "@shared/types/mcp"
import Dexie, { Transaction, type EntityTable } from "dexie"
import { migrateToV2, migrateToV4, migrateToV5, migrateToV7 } from "./migrate"
import { Knowledge } from "@renderer/types/knowledge"
import { RAGEmbeddingConfig, RAGLocalFileInfo } from "@shared/types/rag"

export const name = "db-windflow"

export type Table = {
  providerMeta: EntityTable<ProviderMeta, "name">
  model: EntityTable<ModelMeta, "id">
  chatTopic: EntityTable<ChatTopic, "id">
  chatMessage: EntityTable<ChatMessage, "id">
  chatLLMConfig: EntityTable<ChatLLMConfig, "id">
  chatTTIConfig: EntityTable<ChatTTIConfig, "id">
  settings: EntityTable<Settings<SettingsValue>, "id">
  mcpServer: EntityTable<MCPServerParam, "id">
  knowledge: EntityTable<Knowledge, "id">
  ragFiles: EntityTable<RAGLocalFileInfo, "id">
  embedding: EntityTable<RAGEmbeddingConfig, "id">
}
export type DexieTransaction = Transaction & Table
export type DexieTable = Dexie & Table

const db = new Dexie(name) as DexieTable

db.version(1).stores({
  providerMeta: "name",
  model: "id,providerName,type,active",
  chatTopic: "id,chatMessageId,parentId,createAt",
  chatMessage: "id",
  settings: "id",
  mcpServer: "id",
})
db.version(2)
  .stores({
    providerMeta: "name",
    model: "id,providerName,type,active",
    chatTopic: "id,chatMessageId,parentId,createAt",
    chatMessage: "id",
    settings: "id",
    mcpServer: "id",
  })
  .upgrade(migrateToV2)
db.version(3).stores({
  providerMeta: "name",
  model: "id,providerName,type,active",
  chatTopic: "id,chatMessageId,parentId,createAt",
  chatMessage: "id",
  chatLLMConfig: "id,topicId",
  chatTTIConfig: "id,topicId",
  settings: "id",
  mcpServer: "id",
})
db.version(4)
  .stores({
    providerMeta: "name",
    model: "id",
    chatTopic: "id",
    chatMessage: "id,topicId",
    chatLLMConfig: "id,topicId",
    chatTTIConfig: "id,topicId",
    settings: "id",
    mcpServer: "id",
  })
  .upgrade(migrateToV4)
db.version(5)
  .stores({
    providerMeta: "name",
    model: "id",
    chatTopic: "id",
    chatMessage: "id,topicId",
    chatLLMConfig: "id,topicId",
    chatTTIConfig: "id,topicId",
    settings: "id",
    mcpServer: "id",
  })
  .upgrade(migrateToV5)

db.version(6).stores({
  providerMeta: "name",
  model: "id",
  chatTopic: "id",
  chatMessage: "id,topicId",
  chatLLMConfig: "id,topicId",
  chatTTIConfig: "id,topicId",
  settings: "id",
  mcpServer: "id",
  knowledge: "id,embeddingId",
  ragFiles: "id,topicId",
  embedding: "id",
})

db.version(7)
  .stores({
    providerMeta: "name",
    model: "id",
    chatTopic: "id",
    chatMessage: "id,topicId",
    chatLLMConfig: "id,topicId",
    chatTTIConfig: "id,topicId",
    settings: "id",
    mcpServer: "id",
    knowledge: "id,embeddingId",
    ragFiles: "id,topicId",
    embedding: "id",
  })
  .upgrade(migrateToV7)

export { db }
