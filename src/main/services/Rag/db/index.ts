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
  async function query({ tableName, queryVector, topK = 5, columns = [] }: LanceDBQuery) {
    if (!client) {
      throw new Error("LanceDB not initialized")
    }
    const table = await client.openTable(tableName)
    let query = table.search(queryVector)

    const selectColumns = Array.from(columns)
    if (!selectColumns.includes("id")) {
      selectColumns.push("id")
    }
    query = query.select(selectColumns)
    query = query.limit(topK)
    const results = await query.toArray()
    return results
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
    query,
    listTables,
  }
}
