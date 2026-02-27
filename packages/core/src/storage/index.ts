import Dexie, { TransactionMode } from "dexie"
import { DexieTable, DexieTransaction, QueryParams, TableName } from "@windflow/core/types"
import * as chat from "./chat"
import * as embedding from "./embedding"
import * as knowledge from "./knowledge"
import * as mcp from "./mcp"
import * as model from "./model"
import * as provider from "./provider"
import * as ragFiles from "./ragFiles"
import * as settings from "./settings"
import * as media from "./media"
import { migrateToV4 } from "./migrate"
import PQueue from "p-queue"

export const name = "db-windflow-v2"
export * from "./presets"

const db = new Dexie(name) as DexieTable

db.version(1).stores({
  providerMeta: "name",
  model: "id",
  chatTopic: "id",
  chatMessage: "id,topicId,[topicId+index],fromId,contextFlag",
  chatLLMConfig: "id,topicId",
  chatTTIConfig: "id,topicId",
  settings: "id",
  mcpServer: "id",
  knowledge: "id,embeddingId",
  ragFiles: "id,topicId,[topicId+path]",
  embedding: "id",
})
db.version(2).stores({
  providerMeta: "name",
  model: "id",
  chatTopic: "id,parentId,[parentId+index]",
  chatMessage: "id,topicId,[topicId+index],fromId,contextFlag",
  chatLLMConfig: "id,topicId",
  chatTTIConfig: "id,topicId",
  settings: "id",
  mcpServer: "id",
  knowledge: "id,embeddingId",
  ragFiles: "id,topicId,[topicId+path]",
  embedding: "id",
})
db.version(3).stores({
  providerMeta: "name",
  model: "id,frequency",
  chatTopic: "id,parentId,[parentId+index]",
  chatMessage: "id,topicId,[topicId+index],fromId,contextFlag",
  chatLLMConfig: "id,topicId",
  chatTTIConfig: "id,topicId",
  settings: "id",
  mcpServer: "id",
  knowledge: "id,embeddingId",
  ragFiles: "id,topicId,[topicId+path]",
  embedding: "id",
})
db.version(4)
  .stores({
    providerMeta: "name",
    model: "id,frequency",
    chatTopic: "id,parentId,[parentId+index]",
    chatMessage: "id,topicId,[topicId+index],fromId,contextFlag",
    chatLLMConfig: "id,topicId",
    chatTTIConfig: "id,topicId",
    settings: "id",
    mcpServer: "id",
    knowledge: "id,embeddingId",
    ragFiles: "id,topicId,[topicId+path]",
    embedding: "id",
    media: "id,type",
  })
  .upgrade(migrateToV4)

export const storage = {
  chat,
  model,
  provider,
  knowledge,
  ragFiles,
  embedding,
  settings,
  mcp,
  media,
}
export { db }

export function withTransaction<U>(
  mode: TransactionMode,
  tables: TableName[],
  fn: (trans: DexieTransaction) => PromiseLike<U> | U
) {
  return db.transaction(mode, tables, fn)
}

export function useDBQueue() {
  const queue = new PQueue({ concurrency: 1 })
  /**
   * if transaction is provided, don't use queue.
   * because `Transaction has already completed or failed` error will occur.
   */
  const add = async <T>(
    taskFn: (tx: DexieTransaction | DexieTable) => PromiseLike<T>,
    params?: QueryParams
  ): Promise<T> => {
    if (params?.transaction) {
      return taskFn(params.transaction)
    }
    if (params?.disableQueue) {
      return taskFn(db)
    }
    return queue.add(async () => taskFn(db))
  }

  return {
    add,
  }
}
