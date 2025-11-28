import { RAGFileStatus, RAGLocalFileMeta } from "@shared/types/rag"
import { code4xx, code5xx, errorToText } from "@toolmain/shared"
import { readFile } from "../doc"
import PQueue from "p-queue"
import { TaskChain, TaskInfo, TaskInfoStatus, TaskManager } from "./types"
import { combineUniqueId } from "./utils"
import { encapEmbeddinConfig, log } from "../utils"
export class FileProcessTaskImpl implements TaskChain {
  #queue: PQueue
  #meta: Map<string, AbortController>
  constructor() {
    this.#queue = new PQueue({ concurrency: 5 })
    this.#meta = new Map()
  }
  taskId() {
    return "task_fileProcess"
  }
  stop(meta?: RAGLocalFileMeta) {
    if (!meta) {
      this.#meta.forEach(controller => controller.abort())
      this.#meta.clear()
    } else {
      const id = combineUniqueId(meta)
      const data = this.#meta.get(id)
      if (data) {
        data.abort()
        this.#meta.delete(id)
      }
    }
  }
  async process(info: TaskInfo, manager: TaskManager) {
    const id = combineUniqueId(info.info)
    const abortController = new AbortController()
    this.#meta.set(id, abortController)
    this.#queue.add(
      async ({ signal }) => {
        const statusResp: TaskInfoStatus = {
          taskId: this.taskId(),
          status: RAGFileStatus.Processing,
        }
        try {
          log.debug(`[file process] task start`, info.info, encapEmbeddinConfig(info.config))
          const chunksData = await readFile(info.info, info.config)
          if (signal?.aborted) {
            throw new Error("task aborted")
          }
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
          await manager.next(info, statusResp)
        }
      },
      {
        id,
        signal: abortController.signal,
      }
    )
  }
}
