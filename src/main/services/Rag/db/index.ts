import {
  connect,
  Connection,
  CreateTableOptions,
  Data,
  HnswSqOptions,
  Index,
  IvfFlatOptions,
  SchemaLike,
} from "@lancedb/lancedb"
import { useEnv } from "@main/hooks/useEnv"
import { merge, uniqueId } from "@toolmain/shared"
import path from "node:path"
import * as arrow from "apache-arrow"
import { RAGFile } from "@shared/types/rag"

export const MaxDimensions = 4096

export const TableName = {
  RAGFile: "rag_file",
}
export type LanceQuery = {
  tableName: string
  queryVector: number[]
  topK?: number
  columns?: string[]
}
export type LanceStoreConfig = {
  /**
   * if not set, use the default path of the app
   */
  rootDir?: string
}
export type LanceCreateIndex = {
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
   * @default hnswSq
   */
  indexType?: "hnswSq" | "ivfFlat"
  /**
   * @default cosine
   */
  distanceType?: "l2" | "cosine" | "dot"
  hnswSqConfig?: HnswSqOptions
  ivfFlatConfig?: IvfFlatOptions
}

export class LanceStore {
  #dbName = "lance"
  #env = useEnv()
  #client: Connection | undefined
  #config?: LanceStoreConfig

  isOpen() {
    return this.#client?.isOpen() ?? false
  }
  constructor(config?: LanceStoreConfig) {
    this.#client = undefined
    this.#config = config
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
  async query<T>({ tableName, queryVector, topK = 5, columns = [] }: LanceQuery): Promise<T> {
    if (!this.#client) {
      throw new Error("[query] LanceDB not initialized")
    }
    const table = await this.#client.openTable(tableName)
    let query = table.search(queryVector)

    const selectColumns = Array.from(columns)
    if (!selectColumns.includes("id")) {
      selectColumns.push("id")
    }
    query = query.select(selectColumns).limit(topK)
    const results = await query.toArray()
    return results as T
  }
  async createTable(tableName: string, data: Data, options?: Partial<CreateTableOptions>) {
    if (!this.#client) {
      throw new Error("[query] LanceDB not initialized")
    }
    return this.#client.createTable(tableName, data, options)
  }
  async createEmptyTable(tableName: string, schema: SchemaLike, options?: Partial<CreateTableOptions>) {
    if (!this.#client) {
      throw new Error("[query] LanceDB not initialized")
    }
    return this.#client.createEmptyTable(tableName, schema, options)
  }
  async insert(tableName: string, data: Data) {
    if (!this.#client) {
      throw new Error("[query] LanceDB not initialized")
    }
    const table = await this.#client.openTable(tableName)
    return table.add(data)
  }
  async listTables(): Promise<string[]> {
    if (!this.#client) {
      throw new Error("[query] LanceDB not initialized")
    }
    return await this.#client.tableNames()
  }
  async hasTable(tableName: string): Promise<boolean> {
    if (!this.#client) {
      throw new Error("[query] LanceDB not initialized")
    }
    return (await this.listTables()).includes(tableName)
  }
  async createIndex({
    tableName,
    indexName,
    indexType = "hnswSq",
    distanceType = "cosine",
    hnswSqConfig,
    ivfFlatConfig,
  }: LanceCreateIndex) {
    if (!this.#client) {
      throw new Error("[createIndex] LanceDB not initialized")
    }
    const tables = await this.listTables()
    if (!tables.includes(tableName)) {
      throw new Error(`[createIndex] Table ${tableName} not found`)
    }
    const table = await this.#client.openTable(tableName)
    if (indexType == "hnswSq") {
      return table.createIndex(indexName, {
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
    } else {
      return table.createIndex(indexName, {
        config: Index.ivfFlat(
          merge(
            {
              numPartitions: 128,
              numSubVectors: 16,
            },
            ivfFlatConfig,
            {
              distanceType,
            }
          )
        ),
      })
    }
  }
  close() {
    if (!this.#client) return
    this.#client.close()
    this.#client = undefined
  }
}

export async function initDB(db: LanceStore) {
  await db.open()
  if (!db.hasTable(TableName.RAGFile)) {
    await db.createEmptyTable(
      TableName.RAGFile,
      new arrow.Schema([
        new arrow.Field("id", new arrow.Utf8(), false),
        new arrow.Field(
          "vector",
          new arrow.FixedSizeList(MaxDimensions, new arrow.Field("item", new arrow.Float32(), false)),
          false
        ),
        new arrow.Field("fileId", new arrow.Utf8(), false),
        new arrow.Field("topicId", new arrow.Utf8(), true),
        new arrow.Field("content", new arrow.Utf8(), false),
        new arrow.Field("fileName", new arrow.Utf8(), false),
        new arrow.Field("fileSize", new arrow.Uint32(), false),
        new arrow.Field("mimeType", new arrow.Utf8(), true),
        new arrow.Field("chunkIndex", new arrow.Int32(), false),
        new arrow.Field("tokens", new arrow.Uint32(), true),
      ]),
      { existOk: true, mode: "create" }
    )
  }
  // await db.createIndex({
  //   tableName: TableName.RAGFile,
  //   indexName: "vector",
  //   indexType: "ivfFlat",
  // })
}
