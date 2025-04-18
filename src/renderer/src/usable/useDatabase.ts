import {
  ProviderMeta,
  ModelMeta,
  ChatTopic,
  ChatMessage,
  Settings,
  SettingsValue,
  MCPStdioServer,
} from "@renderer/types"
import Dexie, { type EntityTable } from "dexie"

export const name = "db-ai-chat"

const db = new Dexie(name) as Dexie & {
  providerMeta: EntityTable<ProviderMeta, "name">
  model: EntityTable<ModelMeta, "id">
  chatTopic: EntityTable<ChatTopic, "id">
  chatMessage: EntityTable<ChatMessage, "id">
  settings: EntityTable<Settings<SettingsValue>, "id">
  mcpServer: EntityTable<MCPStdioServer, "serverName">
}

db.version(1).stores({
  providerMeta: "name",
  model: "id,providerName,type,active",
  chatTopic: "id,chatMessageId,parentId,createAt",
  chatMessage: "id",
  settings: "id",
})

db.version(2).stores({
  providerMeta: "name",
  model: "id,providerName,type,active",
  chatTopic: "id,chatMessageId,parentId,createAt",
  chatMessage: "id",
  settings: "id",
  mcpServer: "serverName",
})

export { db }
