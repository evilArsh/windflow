import {
  connect,
  Connection,
  CreateTableOptions,
  Data,
  HnswSqOptions,
  Index,
  IvfFlatOptions,
  IvfPqOptions,
  SchemaLike,
  Table,
} from "@lancedb/lancedb"
import sql from "sqlstring"
import { useEnv } from "@main/hooks/useEnv"
import { RAGFile } from "@windflow/shared"
import { merge } from "@toolmain/shared"
import path from "node:path"

export type VectorQuery = {
  /**
   * the scope of current file, generally a knowledge base id
   */
  topicId: string
  tableName: string
  queryVector: number[]
  topK?: number
}
export type FtsQuery = {
  /**
   * the scope of current file, generally a knowledge base id
   */
  topicId: string
  tableName: string
  content: string
  topK?: number
}
export type VectorStoreConfig = {
  /**
   * if not set, use the default path of the app
   */
  rootDir?: string
}
export type VectorCreateIndex = {
  tableName: string
  /**
   * the table's  column name
   */
  indexName: string
  /**
   * * `ivfPq` 索引 (倒排文件与乘积量化)：适用于大规模数据集，训练过程慢且内存密集；使用乘积量化技术，将向量划分为子向量并进行量化
   *
   * * `ivfFlat` 索引 (倒排文件平面索引)：精度更高但存储需求更大，训练过程慢且内存密集；与IVF-PQ类似，但不进行向量压缩，保持原始向量精度，搜索时直接比较原始向量
   *
   * * `btree` B树索引 (标量列索引)：适合高选择性查询和大多不重复的标量列 性能：10亿行数据仅需约256KB内存，每次查询读取约4KB数据
   *
   * * `bitmap` 位图索引：低基数列（唯一值数量少，通常少于几百个）
   *
   * * `labelList` 标签列表索引：基于底层位图索引实现
   *
   * * `fts` 全文搜索索引
   *
   * * `hnswPq` 索引 (分层可导航小世界与乘积量化)
   *
   * * `hnswSq` 索引 (分层可导航小世界与标量量化)
   *
   */
  indexType: "hnswSq" | "ivfFlat" | "ivfPq"
  /**
   * @default cosine
   */
  distanceType?: "l2" | "cosine" | "dot"
  hnswSqConfig?: HnswSqOptions
  ivfFlatConfig?: IvfFlatOptions
  ivfPqConfig?: IvfPqOptions
}

export class VectorStore {
  #dbName = "vector"
  #env = useEnv()
  #client: Connection | undefined
  #config?: VectorStoreConfig

  isOpen() {
    return this.#client?.isOpen() ?? false
  }
  constructor(config?: VectorStoreConfig) {
    this.#client = undefined
    this.#config = config
  }
  #getClient() {
    if (!this.#client) {
      throw new Error("VectorDB not initialized")
    }
    return this.#client
  }
  async open() {
    try {
      if (this.isOpen()) return
      this.#client = await connect(
        this.#config?.rootDir ? path.resolve(this.#config.rootDir, this.#dbName) : this.#env.resolveDir(this.#dbName)
      )
    } catch (error) {
      console.error("[store open error]", error)
    }
  }
  #defaultSearchColumns(): string[] {
    return [
      "id",
      "fileId",
      "configId",
      "topicId",
      "content",
      "fileName",
      "filePath",
      "fileSize",
      "chunkIndex",
      "mimeType",
      "tokens",
    ]
  }
  /**
   * vector similarity search
   */
  async search({ tableName, queryVector, topicId, topK = 10 }: VectorQuery): Promise<RAGFile[]> {
    let table: Table | undefined
    try {
      const client = this.#getClient()
      table = await client.openTable(tableName)
      const columns = this.#defaultSearchColumns()
      columns.push("_distance")
      const query = table
        .vectorSearch(queryVector)
        .distanceType("cosine")
        .select(columns)
        .where(sql.format("`topicId` = ?", [topicId]))
        .limit(topK)
      const results = (await query.toArray()) as RAGFile[]
      table.close()
      return results
    } finally {
      table?.close()
    }
  }
  /**
   * full test search (fts)
   */
  async searchFts({ tableName, content, topicId, topK = 10 }: FtsQuery): Promise<RAGFile[]> {
    let table: Table | undefined
    try {
      const client = this.#getClient()
      table = await client.openTable(tableName)
      const columns = this.#defaultSearchColumns()
      table.query()
      columns.push("_score")
      const query = table
        .search(content, "fts", ["content", "_score"])
        .select(columns)
        .where(sql.format("`topicId` = ?", [topicId]))
        .limit(topK)
      const results = (await query.toArray()) as RAGFile[]
      table.close()
      return results
    } finally {
      table?.close()
    }
  }
  async createTable(tableName: string, data: Data, options?: Partial<CreateTableOptions>) {
    const client = this.#getClient()
    return client.createTable(tableName, data, options)
  }
  async createEmptyTable(tableName: string, schema: SchemaLike, options?: Partial<CreateTableOptions>) {
    const client = this.#getClient()
    return client.createEmptyTable(tableName, schema, options)
  }
  async insert(tableName: string, data: Data) {
    let table: Table | undefined
    try {
      const client = this.#getClient()
      table = await client.openTable(tableName)
      const res = await table.add(data)
      table.close()
      return res
    } finally {
      table?.close()
    }
  }
  async upsert(tableName: string, data: Data) {
    let table: Table | undefined
    try {
      const client = this.#getClient()
      table = await client.openTable(tableName)
      const res = await table.mergeInsert("id").whenMatchedUpdateAll().whenNotMatchedInsertAll().execute(data)
      table.close()
      return res
    } finally {
      table?.close()
    }
  }
  async listTables(): Promise<string[]> {
    const client = this.#getClient()
    return await client.tableNames()
  }
  async hasTable(tableName: string): Promise<boolean> {
    // FIXME: `tableNames` will return all table names.
    // if some tables' directory exist but with empty file, when open it, will throw error like: Error: Table 'xxxxx' was not found
    let table: Table | undefined
    try {
      const client = this.#getClient()
      table = await client.openTable(tableName)
      table.close()
      return true
    } catch (_) {
      return false
    } finally {
      table?.close()
    }
  }
  async countRows(tableName: string, filter?: string | undefined): Promise<number> {
    let table: Table | undefined
    try {
      const client = this.#getClient()
      table = await client.openTable(tableName)
      const res = await table.countRows(filter)
      table.close()
      return res
    } finally {
      table?.close()
    }
  }
  async clearTable(tableName: string): Promise<number> {
    let table: Table | undefined
    try {
      const client = this.#getClient()
      table = await client.openTable(tableName)
      const rows = await table.countRows()
      await table.delete("true")
      const res = rows - (await table.countRows())
      table.close()
      return res
    } finally {
      table?.close()
    }
  }
  async deleteTable(tableName: string): Promise<void> {
    const client = this.#getClient()
    if (!(await this.hasTable(tableName))) return
    return client.dropTable(tableName)
  }
  async deleteData(tableName: string, predicate: string): Promise<number> {
    let table: Table | undefined
    try {
      const client = this.#getClient()
      table = await client.openTable(tableName)
      const rows = await this.countRows(tableName, predicate)
      await table.delete(predicate)
      table.close()
      return rows
    } finally {
      table?.close()
    }
  }
  async hasIndex(tableName: string, indexName: string): Promise<boolean> {
    let table: Table | undefined
    try {
      const client = this.#getClient()
      table = await client.openTable(tableName)
      const indices = await table.listIndices()
      table.close()
      return !!indices.find(index => index.name === indexName)
    } finally {
      table?.close()
    }
  }
  async createIndex({
    tableName,
    indexName,
    indexType,
    distanceType = "cosine",
    hnswSqConfig,
    ivfFlatConfig,
    ivfPqConfig,
  }: VectorCreateIndex) {
    let table: Table | undefined
    try {
      const client = this.#getClient()
      if (!(await this.hasTable(tableName))) {
        throw new Error(`[createIndex] Table ${tableName} not found`)
      }
      table = await client.openTable(tableName)
      if (indexType == "hnswSq") {
        await table.createIndex(indexName, {
          config: Index.hnswSq(
            merge(
              {
                numPartitions: 128,
                numSubVectors: 16,
              },
              hnswSqConfig,
              {
                distanceType,
              }
            )
          ),
        })
        table.close()
        return
      } else if (indexType == "ivfPq") {
        await table.createIndex(indexName, {
          config: Index.ivfPq(
            merge(
              {
                numPartitions: 128,
                numSubVectors: 16,
              },
              ivfPqConfig,
              {
                distanceType,
              }
            )
          ),
        })
        table.close()
        return
      } else {
        await table.createIndex(indexName, {
          config: Index.ivfFlat(
            merge(
              {
                numPartitions: 128,
              },
              ivfFlatConfig,
              {
                distanceType,
              }
            )
          ),
        })
        table.close()
        return
      }
    } finally {
      table?.close()
    }
  }
  close() {
    if (!this.#client) return
    this.#client.close()
    this.#client = undefined
  }
}
