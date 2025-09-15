import { connect, Connection, CreateTableOptions, Data, HnswSqOptions, Index, IvfFlatOptions } from "@lancedb/lancedb"
import { useEnv } from "@main/hooks/useEnv"
import { merge } from "@toolmain/shared"

export type LanceQuery = {
  tableName: string
  queryVector: number[]
  topK?: number
  columns?: string[]
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

export function useLanceDB() {
  const dbName = "lance.db"
  const env = useEnv()
  let client: Connection | undefined

  function isOpen() {
    return client?.isOpen() ?? false
  }
  async function open() {
    if (isOpen()) return
    client = await connect(env.resolveDir(dbName))
  }
  async function query({ tableName, queryVector, topK = 5, columns = [] }: LanceQuery) {
    if (!client) {
      throw new Error("[query] LanceDB not initialized")
    }
    const table = await client.openTable(tableName)
    let query = table.search(queryVector)

    const selectColumns = Array.from(columns)
    if (!selectColumns.includes("id")) {
      selectColumns.push("id")
    }
    query = query.select(selectColumns).limit(topK)
    const results = await query.toArray()
    return results
  }
  async function createTable(tableName: string, data: Data, options?: Partial<CreateTableOptions>) {
    if (!client) {
      throw new Error("[query] LanceDB not initialized")
    }
    return client.createTable(tableName, data, options)
  }
  async function listTables(): Promise<string[]> {
    if (!client) {
      throw new Error("[query] LanceDB not initialized")
    }
    return await client.tableNames()
  }
  async function createIndex({
    tableName,
    indexName,
    indexType = "hnswSq",
    distanceType = "cosine",
    hnswSqConfig,
    ivfFlatConfig,
  }: LanceCreateIndex) {
    if (!client) {
      throw new Error("[createIndex] LanceDB not initialized")
    }
    const tables = await listTables()
    if (!tables.includes(tableName)) {
      throw new Error(`[createIndex] Table ${tableName} not found`)
    }
    const table = await client.openTable(tableName)
    if (indexType == "hnswSq") {
      table.createIndex(indexName, {
        config: Index.hnswSq(
          merge({}, hnswSqConfig, {
            distanceType,
          })
        ),
      })
    } else {
      table.createIndex(indexName, {
        config: Index.ivfFlat(
          merge({}, ivfFlatConfig, {
            distanceType,
          })
        ),
      })
    }
  }
  function close() {
    if (!client) return
    client.close()
    client = undefined
  }
  return {
    isOpen,
    open,
    close,
    createTable,
    query,
    listTables,
    createIndex,
  }
}
