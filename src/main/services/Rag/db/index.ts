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
  VectorQuery as LanceVectorQuery,
} from "@lancedb/lancedb"
import { useEnv } from "@main/hooks/useEnv"
import { RAGFile } from "@shared/types/rag"
import { merge } from "@toolmain/shared"
import path from "node:path"

export type VectorQuery = {
  tableName: string
  topicId: string
  queryVector: number[]
  topK?: number
  // columns?: string[]
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
  async query({ tableName, queryVector, topicId, topK = 5 }: VectorQuery): Promise<RAGFile[]> {
    if (!this.#client) {
      throw new Error("[query] VectorDB not initialized")
    }
    const table = await this.#client.openTable(tableName)
    const query = (table.search(queryVector, "vector") as LanceVectorQuery)
      .distanceType("cosine")
      .select([
        "_distance",
        "id",
        // "vector",
        "fileId",
        "configId",
        "topicId",
        "content",
        "fileName",
        "fileSize",
        "chunkIndex",
        "mimeType",
        "tokens",
      ])
      .where(`\`topicId\` = '${topicId}' OR \`topicId\` = ''`)
      .limit(topK)
    const results = (await query.toArray()) as RAGFile[]
    return results
  }
  async createTable(tableName: string, data: Data, options?: Partial<CreateTableOptions>) {
    if (!this.#client) {
      throw new Error("[query] VectorDB not initialized")
    }
    return this.#client.createTable(tableName, data, options)
  }
  async createEmptyTable(tableName: string, schema: SchemaLike, options?: Partial<CreateTableOptions>) {
    if (!this.#client) {
      throw new Error("[query] VectorDB not initialized")
    }
    return this.#client.createEmptyTable(tableName, schema, options)
  }
  async insert(tableName: string, data: Data) {
    if (!this.#client) {
      throw new Error("[query] VectorDB not initialized")
    }
    const table = await this.#client.openTable(tableName)
    return table.add(data)
  }
  async upsert(tableName: string, data: Data) {
    if (!this.#client) {
      throw new Error("[query] VectorDB not initialized")
    }
    const table = await this.#client.openTable(tableName)
    return table.mergeInsert("id").whenMatchedUpdateAll().whenNotMatchedInsertAll().execute(data)
  }
  async listTables(): Promise<string[]> {
    if (!this.#client) {
      throw new Error("[query] VectorDB not initialized")
    }
    return await this.#client.tableNames()
  }
  async hasTable(tableName: string): Promise<boolean> {
    if (!this.#client) {
      throw new Error("[query] VectorDB not initialized")
    }
    return (await this.listTables()).includes(tableName)
  }
  async countRows(tableName: string): Promise<number> {
    if (!this.#client) {
      throw new Error("[query] VectorDB not initialized")
    }
    const table = await this.#client.openTable(tableName)
    return table.countRows()
  }
  async clearTable(tableName: string): Promise<number> {
    if (!this.#client) {
      throw new Error("[query] VectorDB not initialized")
    }
    const table = await this.#client.openTable(tableName)
    const rows = await table.countRows()
    await table.delete("true")
    return rows - (await table.countRows())
  }
  async deleteTable(tableName: string): Promise<void> {
    if (!this.#client) {
      throw new Error("[query] VectorDB not initialized")
    }
    return this.#client.dropTable(tableName)
  }
  async hasIndex(tableName: string, indexName: string): Promise<boolean> {
    if (!this.#client) {
      throw new Error("[query] VectorDB not initialized")
    }
    const table = await this.#client.openTable(tableName)
    const indices = await table.listIndices()
    return !!indices.find(index => index.name === indexName)
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
    if (!this.#client) {
      throw new Error("[createIndex] VectorDB not initialized")
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
    } else if (indexType == "ivfPq") {
      return table.createIndex(indexName, {
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
    } else {
      return table.createIndex(indexName, {
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
    }
  }
  close() {
    if (!this.#client) return
    this.#client.close()
    this.#client = undefined
  }
}
