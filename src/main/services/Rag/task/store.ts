import { RAGFileStatus, RAGLocalFileMeta } from "@shared/types/rag"
import PQueue from "p-queue"
import { TaskChain, TaskInfo, TaskInfoStatus, TaskManager } from "./types"
import { errorToText } from "@toolmain/shared"
import { VectorStore } from "../db"
import { useLog } from "@main/hooks/useLog"
import { combineTableName, createTableSchema } from "../db/utils"
import { RAGServiceId } from "../vars"
import sql from "sqlstring"

export class StoreTaskImpl implements TaskChain {
  #queue: PQueue
  #db: VectorStore
  #log = useLog(RAGServiceId)
  constructor(db: VectorStore) {
    this.#queue = new PQueue({ concurrency: 5 })
    this.#db = db
  }
  taskId() {
    return "task_storage"
  }
  stop(meta?: RAGLocalFileMeta) {
    this.#queue.clear()
    this.#db.close()
  }
  async process(taskInfo: TaskInfo, manager: TaskManager) {
    this.#queue.add(async () => {
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
        this.#log.debug(
          `[store process] will insert data to database, original_length: ${taskInfo.data.length}, avaliable_length: ${avaliableData.length}`
        )
        if (avaliableData.length) {
          const tableName = combineTableName(taskInfo.info.topicId)
          if (!(await this.#db.hasTable(tableName))) {
            this.#log.debug(`[store process] [insert] table not exists, will create new one, table name: ${tableName}`)
            const schema = createTableSchema(taskInfo.config.dimensions)
            await this.#db.createEmptyTable(tableName, schema)
          } else {
            // cond1: different task with same file
            // cond2: different task with same id (also same file path)
            const cond = sql.format("`filePath` = ? OR `id` = ?", [taskInfo.info.path, taskInfo.info.id])
            const pathRows = await this.#db.countRows(tableName, cond)
            if (pathRows) {
              this.#log.debug(`[store process] [insert] will clean old data, counts: ${pathRows}`)
              await this.#db.deleteData(tableName, cond)
            }
          }
          this.#log.debug(`[store process] [insert] data to database, table: ${tableName}`)
          await this.#db.insert(tableName, avaliableData)
          const count = await this.#db.countRows(tableName)
          if (count > 256 && !(await this.#db.hasIndex(tableName, "vector"))) {
            this.#log.debug(`[store process] create index for table: ${tableName}, count: ${count}`)
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
      } catch (error) {
        this.#log.error("[store process error]", errorToText(error))
        statusResp.status = RAGFileStatus.Failed
        statusResp.msg = errorToText(error)
        statusResp.code = 500
      } finally {
        await manager.next(taskInfo, statusResp)
      }
    })
  }
}
