import {
  ProviderMeta,
  ModelMeta,
  ChatTopic,
  ChatMessage,
  Settings,
  SettingsValue,
  ChatLLMConfig,
  ChatTTIConfig,
  Knowledge,
} from "."
import { MCPServerParam } from "@windflow/shared/types"
import Dexie, { Transaction, type EntityTable } from "dexie"
import { RAGEmbeddingConfig, RAGLocalFileInfo } from "@windflow/shared/types"

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
export type QueryParams = {
  transaction?: DexieTransaction
}
