import { connect, Connection, CreateTableOptions, Data } from "@lancedb/lancedb"
import { useEnv } from "@main/hooks/useEnv"
import log from "electron-log"
import * as arrow from "apache-arrow"
import { errorToText } from "@toolmain/shared"

export type LanceDBQuery = {
  tableName: string
  queryVector: number[]
  topK?: number
  columns?: string[]
}

export function useLanceDB() {
  const dbName = "lance.db"
  const env = useEnv()
  let client: Connection | undefined
  async function init() {
    if (!client) {
      client = await connect(env.resolveDir(dbName))
    }
  }
  async function query(query: LanceDBQuery) {
    if (!client) {
      throw new Error("LanceDB not initialized")
    }
    const tb = await client.openTable(query.tableName)
    const selectColumns = [...(query.columns ?? [])]
    if (!selectColumns.includes("id")) {
      selectColumns.push("id")
    }
  }
  async function createTable(tableName: string, data: Data, options?: Partial<CreateTableOptions>) {
    if (!client) {
      throw new Error("LanceDB not initialized")
    }
    return client.createTable(tableName, data, options)
  }
  async function listTables(): Promise<string[]> {
    if (!client) {
      throw new Error("LanceDB not initialized")
    }
    return await client.tableNames()
  }
  async function createIndex() {
    if (!client) {
      throw new Error("LanceDB not initialized")
    }
  }
  return {
    init,

    createTable,
    listTables,
  }
}
