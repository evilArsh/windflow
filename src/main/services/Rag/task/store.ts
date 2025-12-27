import { RAGFileStatus, RAGLocalFileMeta } from "@windflow/shared"
import PQueue from "p-queue"
import { TaskChain, TaskInfo, TaskInfoStatus, TaskManager } from "./types"
import { errorToText } from "@toolmain/shared"
import { VectorStore } from "../db"
import { combineTableName, createTableSchema } from "../db/utils"
import sql from "sqlstring"
import { combineUniqueId } from "./utils"
import { log } from "../utils"

export class StoreTaskImpl implements TaskChain {
  #queue: PQueue
  #db: VectorStore
  #meta: Map<string, AbortController>
  constructor(db: VectorStore) {
    this.#queue = new PQueue({ concurrency: 5 })
    this.#db = db
    this.#meta = new Map()
  }
  taskId() {
    return "task_storage"
  }
  stop(meta?: RAGLocalFileMeta) {
    if (!meta) {
      this.#meta.forEach(controller => controller.abort())
      this.#meta.clear()
      this.#db.close()
    } else {
      const id = combineUniqueId(meta)
      const data = this.#meta.get(id)
      if (data) {
        data.abort()
        this.#meta.delete(id)
      }
    }
  }
  async process(taskInfo: TaskInfo, manager: TaskManager) {
    const id = combineUniqueId(taskInfo.info)
    const abortController = new AbortController()
    this.#meta.set(id, abortController)
    this.#queue.add(
      async ({ signal }) => {
        const statusResp: TaskInfoStatus = {
          taskId: this.taskId(),
          status: RAGFileStatus.Processing,
        }
        try {
          if (!taskInfo.data.length) {
            throw new Error("[store process], no data to process")
          }
          await this.#db.open()
          const avaliableData = taskInfo.data.filter(d => !!d.vector.length)
          log.debug(
            `[store process] will insert data to database, original_length: ${taskInfo.data.length}, avaliable_length: ${avaliableData.length}`
          )
          if (avaliableData.length) {
            const tableName = combineTableName(taskInfo.info.topicId)
            if (!(await this.#db.hasTable(tableName))) {
              log.debug(`[store process] [insert] table not exists, will create new one, table name: ${tableName}`)
              const schema = createTableSchema(taskInfo.config.dimensions)
              await this.#db.createEmptyTable(tableName, schema)
            } else {
              // cond1: different task with same file
              // cond2: different task with same id (also same file path)
              const cond = sql.format("`filePath` = ? or `fileId` = ?", [taskInfo.info.path, taskInfo.info.id])
              const pathRows = await this.#db.countRows(tableName, cond)
              log.debug(
                `[store process] [insert] old table exists, check if need to clear, pathRows: ${pathRows}, cond: ${cond}`
              )
              if (pathRows) {
                log.debug(`[store process] [insert] will clean old data, counts: ${pathRows}`)
                await this.#db.deleteData(tableName, cond)
              }
            }
            log.debug(`[store process] [insert] data to database, table: ${tableName}`)
            await this.#db.insert(tableName, avaliableData)
            const count = await this.#db.countRows(tableName)
            if (count > 256 && !(await this.#db.hasIndex(tableName, "vector"))) {
              log.debug(`[store process] create index for table: ${tableName}, count: ${count}`)
              await this.#db.createIndex({
                tableName,
                indexName: "vector",
                indexType: "ivfFlat",
                distanceType: "cosine",
                ivfFlatConfig: {
                  sampleRate: 256,
                },
              })
            }
          }
          statusResp.status = RAGFileStatus.Success
          statusResp.code = 200
          statusResp.msg = "ok"
          if (signal?.aborted) {
            statusResp.msg = "aborted"
            statusResp.status = RAGFileStatus.Failed
            statusResp.code = 499
          }
        } catch (error) {
          log.error("[store process error]", errorToText(error))
          statusResp.status = RAGFileStatus.Failed
          statusResp.msg = errorToText(error)
          statusResp.code = 500
        } finally {
          await manager.next(taskInfo, statusResp)
        }
      },
      {
        id,
        signal: abortController.signal,
      }
    )
  }
}
