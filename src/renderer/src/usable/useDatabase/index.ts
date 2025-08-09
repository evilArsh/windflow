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
import Dexie, { type EntityTable } from "dexie"
import { migrateToV2, migrateToV4, migrateToV5 } from "./migrate"

export const name = "db-ai-chat"

const db = new Dexie(name) as Dexie & {
  providerMeta: EntityTable<ProviderMeta, "name">
  model: EntityTable<ModelMeta, "id">
  chatTopic: EntityTable<ChatTopic, "id">
  chatMessage: EntityTable<ChatMessage, "id">
  chatLLMConfig: EntityTable<ChatLLMConfig, "id">
  chatTTIConfig: EntityTable<ChatTTIConfig, "id">
  settings: EntityTable<Settings<SettingsValue>, "id">
  mcpServer: EntityTable<MCPServerParam, "id">
}

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

export { db }
