import { RAGFileStatus, RAGLocalFileMeta } from "@shared/types/rag"
import { code4xx, code5xx, errorToText } from "@toolmain/shared"
import { readFile } from "../doc"
import PQueue from "p-queue"
import { TaskChain, TaskInfo, TaskInfoStatus, TaskManager } from "./types"
import { useLog } from "@main/hooks/useLog"
import { RAGServiceId } from "../vars"
export class FileProcessTaskImpl implements TaskChain {
  #queue: PQueue
  #log = useLog(RAGServiceId)
  constructor() {
    this.#queue = new PQueue({ concurrency: 5 })
  }
  taskId() {
    return "task_fileProcess"
  }
  stop(meta?: RAGLocalFileMeta) {
    // FIXME: need add signal, when quene clear, also break the async task or stop async result from going on exec
    this.#queue.clear()
  }
  async process(info: TaskInfo, manager: TaskManager) {
    this.#queue.add(async () => {
      const statusResp: TaskInfoStatus = {
        taskId: this.taskId(),
        status: RAGFileStatus.Processing,
      }
      try {
        this.#log.debug(`[file process] task start`, info)
        const chunksData = await readFile(info.info, info.config)
        this.#log.debug(`[file process] task finish`, chunksData)
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
        this.#log.error("[file process] error", errorToText(error))
        statusResp.status = RAGFileStatus.Failed
        statusResp.msg = errorToText(error)
        statusResp.code = 500
      } finally {
        await manager.next(info, statusResp)
      }
    })
  }
}
