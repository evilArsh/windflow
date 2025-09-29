import { RAGFileStatus } from "@shared/types/rag"
import PQueue from "p-queue"
import { TaskChain, TaskInfo, TaskInfoStatus, TaskManager } from "./types"
import { errorToText } from "@toolmain/shared"
import { LanceStore, TableName } from "../db"
import { useLog } from "@main/hooks/useLog"
import { RAGServiceId } from ".."

const log = useLog(RAGServiceId)

export class Store implements TaskChain {
  #manager: TaskManager
  #queue: PQueue
  #db: LanceStore
  constructor(manager: TaskManager, db: LanceStore) {
    this.#manager = manager
    this.#queue = new PQueue({ concurrency: 5 })
    this.#db = db
  }
  taskId() {
    return "task_storage"
  }
  close() {
    this.#queue.clear()
    this.#db.close()
  }
  async process(info: TaskInfo) {
    this.#queue.add(async () => {
      const statusResp: TaskInfoStatus = {
        taskId: this.taskId(),
        status: RAGFileStatus.Processing,
      }
      try {
        if (!info.data.length) {
          throw new Error("[store process], no data to process")
        }
        await this.#db.open()
        const avaliableData = info.data.filter(d => !!d.vector.length)
        log.debug(
          `[store process] will insert data to database, original-length: ${info.data.length}, avaliable_length: ${avaliableData.length}`
        )
        if (avaliableData.length) {
          const res = await this.#db.insert(TableName.RAGFile, avaliableData)
          log.debug(`[store process] insert data to database, result: `, res)
        }
        statusResp.code = 200
        statusResp.msg = "ok"
      } catch (error) {
        log.error("[store process error]", errorToText(error))
        statusResp.status = RAGFileStatus.Failed
        statusResp.msg = errorToText(error)
        statusResp.code = 500
      } finally {
        this.#manager.next(info, statusResp)
      }
    })
  }
}
