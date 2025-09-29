import { RAGFileStatus } from "@shared/types/rag"
import { code4xx, code5xx, errorToText } from "@toolmain/shared"
import { readFile } from "../doc"
import PQueue from "p-queue"
import { TaskChain, TaskInfo, TaskInfoStatus, TaskManager } from "./types"
import { useLog } from "@main/hooks/useLog"
import { RAGServiceId } from ".."
const log = useLog(RAGServiceId)
export class FileProcess implements TaskChain {
  #manager: TaskManager
  #queue: PQueue
  constructor(manager: TaskManager) {
    this.#manager = manager
    this.#queue = new PQueue({ concurrency: 5 })
  }
  taskId() {
    return "task_fileProcess"
  }
  async process(info: TaskInfo) {
    this.#queue.add(async () => {
      const statusResp: TaskInfoStatus = {
        taskId: this.taskId(),
        status: RAGFileStatus.Processing,
      }
      try {
        log.debug(`[file process] task start`, info)
        const chunksData = await readFile(info.info, info.config)
        log.debug(`[file process] task finish`, chunksData)
        if (code4xx(chunksData.code) || code5xx(chunksData.code)) {
          statusResp.status = RAGFileStatus.Failed
          statusResp.msg = chunksData.msg
          statusResp.code = chunksData.code
        } else {
          info.data = chunksData.data
          statusResp.status = RAGFileStatus.Success
          statusResp.msg = "ok"
          statusResp.code = 200
        }
      } catch (error) {
        log.error("[file process] error", errorToText(error))
        statusResp.status = RAGFileStatus.Failed
        statusResp.msg = errorToText(error)
        statusResp.code = 500
      } finally {
        this.#manager.next(info, statusResp)
      }
    })
  }
  close() {
    // FIXME: need add signal, when quene clear, also break the async task or stop async result from going on exec
    this.#queue.clear()
  }
}
