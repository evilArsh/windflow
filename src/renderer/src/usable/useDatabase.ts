import {
  ProviderMeta,
  ModelMeta,
  ChatTopic,
  ChatMessage2,
  Settings,
  SettingsValue,
  ChatLLMConfig,
  ChatTTIConfig,
} from "@renderer/types"
import { MCPServerParam } from "@shared/types/mcp"
import Dexie, { type EntityTable } from "dexie"

export const name = "db-ai-chat"

const db = new Dexie(name) as Dexie & {
  providerMeta: EntityTable<ProviderMeta, "id">
  model: EntityTable<ModelMeta, "id">
  chatTopic: EntityTable<ChatTopic, "id">
  chatMessage: EntityTable<ChatMessage2, "id">
  chatLLMConfig: EntityTable<ChatLLMConfig, "id">
  chatTTIConfig: EntityTable<ChatTTIConfig, "id">
  settings: EntityTable<Settings<SettingsValue>, "id">
  mcpServer: EntityTable<MCPServerParam, "id">
}

db.version(1).stores({
  providerMeta: "id,name",
  model: "id",
  chatTopic: "id",
  chatMessage: "id,topicId",
  chatLLMConfig: "id,topicId",
  chatTTIConfig: "id,topicId",
  settings: "id",
  mcpServer: "id",
})

export { db }
