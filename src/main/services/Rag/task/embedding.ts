import { RAGFile, RAGFileStatus } from "@shared/types/rag"
import PQueue from "p-queue"
import { EmbeddingResponse, TaskChain, TaskInfo, TaskInfoStatus, TaskManager } from "./types"
import axios, { AxiosResponse } from "axios"
import { errorToText, isArray, toNumber } from "@toolmain/shared"
import { LanceStore, TableName } from "../db"
import { useLog } from "@main/hooks/useLog"
import { RAGServiceId } from ".."

const log = useLog(RAGServiceId)
const requestWithChunks = async <T>(
  chunks: RAGFile[],
  request: () => Promise<T>
): Promise<{ chunks: RAGFile[]; response: T }> => {
  const response = await request()
  return { chunks, response }
}
export class Embedding implements TaskChain {
  #manager: TaskManager
  #queue: PQueue
  #db: LanceStore
  constructor(manager: TaskManager) {
    this.#manager = manager
    this.#queue = new PQueue({ concurrency: 5 })
    this.#db = new LanceStore()
  }
  taskId() {
    return "task-embedding"
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
          throw new Error("[embedding process], no data to process")
        }
        const maxinput = toNumber(info.config.maxInputs)
        if (!maxinput || !info.data.length) {
          throw new Error(
            `[embedding process] inputs is invalid, max-inputs: ${maxinput}, data-length: ${info.data.length}`
          )
        }
        const asyncReqs: Array<Promise<{ chunks: RAGFile[]; response: Awaited<AxiosResponse<EmbeddingResponse>> }>> = []
        log.debug(`[embedding process] start process chunk, info: `, info)
        for (let i = 0; i < info.data.length; i += maxinput) {
          const chunk = info.data.slice(i, i + maxinput)
          const inputContent = chunk.map(item => item.content)
          log.debug(
            `[embedding process] splitting chunks, total: ${info.data.length}, chunk: ${i}-${i + maxinput}`,
            info.config
          )
          asyncReqs.push(
            requestWithChunks(chunk, async () =>
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
          )
        }
        const responses = await Promise.allSettled(asyncReqs)
        responses.forEach(res => {
          log.debug(`[embedding process] response: `, res)
          if (res.status === "fulfilled") {
            const { chunks, response } = res.value
            const data = response.data?.data
            const model = response.data?.model
            if (isArray(data)) {
              log.debug(`[embedding response] data-length: ${data.length} model: ${model}`)
              if (chunks.length !== data.length) {
                throw new Error(
                  `[embedding response] length of chunks doesn't match the length of returned data. ids-length: ${chunks.length} data-length: ${data.length}`
                )
              }
              data.forEach((vector, index) => {
                chunks[index].vector = vector.embedding
              })
              log.debug(
                `[embedding response]`,
                `file: ${info.info.path}, total size: ${info.data.length}, chunk size: ${chunks.length}`
              )
            } else {
              log.error(`[embedding response format error]`, res.value)
            }
          } else {
            log.error(`[embedding response error] ${errorToText(res.reason)}`)
          }
        })
        await this.#db.open()
        log.debug(`[embedding process] insert data to database`, info.data)
        this.#db.insert(TableName.RAGFile, info.data)
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
