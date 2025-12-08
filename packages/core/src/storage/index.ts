import Dexie from "dexie"
import { DexieTable } from "@windflow/core/types"
import * as chat from "./chat"
import * as embedding from "./embedding"
import * as knowledge from "./knowledge"
import * as mcp from "./mcp"
import * as model from "./model"
import * as provider from "./provider"
import * as ragFiles from "./ragFiles"
import * as settings from "./settings"

export const name = "db-windflow"

const db = new Dexie(name) as DexieTable

db.version(1).stores({
  providerMeta: "name",
  model: "id",
  chatTopic: "id",
  chatMessage: "id,topicId",
  chatLLMConfig: "id,topicId",
  chatTTIConfig: "id,topicId",
  settings: "id",
  mcpServer: "id",
  knowledge: "id,embeddingId",
  ragFiles: "id,topicId,[topicId+path]",
  embedding: "id",
})
export { db }

export const storage = {
  chat,
  model,
  provider,
  knowledge,
  ragFiles,
  embedding,
  settings,
  mcp,
}
