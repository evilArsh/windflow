import { RAGFileStatus } from "@shared/types/rag"
import PQueue from "p-queue"
import { TaskChain, TaskInfo, TaskInfoStatus, TaskManager } from "./types"
import log from "electron-log"
import axios, { AxiosResponse } from "axios"
import { errorToText, isArray, toNumber } from "@toolmain/shared"

type EmbeddingResponse = {
  data?: Array<{ embedding: number[] }>
  model: string
  usage?: {
    total_tokens: number
  }
}
export class Embedding implements TaskChain {
  #manager: TaskManager
  #queue: PQueue
  constructor(manager: TaskManager) {
    this.#manager = manager
    this.#queue = new PQueue({ concurrency: 5 })
  }
  taskId() {
    return "task-embedding"
  }
  async process(info: TaskInfo) {
    this.#queue.add(async () => {
      const statusResp: TaskInfoStatus = {
        taskId: this.taskId(),
        status: RAGFileStatus.Processing,
      }
      try {
        if (!info.data.length) {
          throw new Error("[embedding process], no data to process")
        }
        const maxinput = toNumber(info.config.maxInputs)
        if (!maxinput || !info.data.length) {
          throw new Error(
            `[embedding process] inputs is invalid, max-inputs: ${maxinput}, data-length: ${info.data.length}`
          )
        }
        const asyncReqs: Array<Promise<AxiosResponse<EmbeddingResponse>>> = []
        for (let i = 0; i < info.data.length; i += maxinput) {
          const chunk = info.data.slice(i, i + maxinput)
          const inputContent = chunk.map(item => item.content)
          asyncReqs.push(
            axios.request({
              url: info.config.embedding.api,
              method: info.config.embedding.method ?? "post",
              data: {
                model: info.config.embedding.model,
                input: inputContent,
                dimensions: info.config.dimensions,
              },
            })
          )
        }
        const responses = await Promise.allSettled(asyncReqs)
        responses.forEach(res => {
          if (res.status === "fulfilled") {
            const data = res.value.data?.data
            const model = res.value.data?.model
            if (isArray(data)) {
              log.debug(`[embedding response] data-length: ${data.length} model: ${model}`)
              // TODO:继续
            } else {
              log.error(`[embedding response format error]`, res.value)
            }
          } else {
            log.error(`[embedding response error] ${errorToText(res.reason)}`)
          }
        })
      } catch (error) {
        log.error("[embedding process error]", errorToText(error))
        statusResp.status = RAGFileStatus.Failed
        statusResp.msg = errorToText(error)
        statusResp.code = 500
      } finally {
        this.#manager.next(info, statusResp)
      }
    })
  }
}
