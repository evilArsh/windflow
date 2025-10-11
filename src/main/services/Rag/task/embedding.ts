import { RAGFile, RAGFileStatus } from "@shared/types/rag"
import PQueue from "p-queue"
import { EmbeddingResponse, TaskChain, TaskInfo, TaskInfoStatus, TaskManager } from "./types"
import axios, { AxiosResponse } from "axios"
import { errorToText, isArray, toNumber } from "@toolmain/shared"
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
  constructor(manager: TaskManager) {
    this.#manager = manager
    this.#queue = new PQueue({ concurrency: 5 })
  }
  taskId() {
    return "task_embedding"
  }
  close() {
    this.#queue.clear()
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
            `[embedding process] inputs is invalid, max_inputs: ${maxinput}, data_length: ${info.data.length}`
          )
        }
        const asyncReqs: Array<Promise<{ chunks: RAGFile[]; response: Awaited<AxiosResponse<EmbeddingResponse>> }>> = []
        log.debug(
          `[embedding process] start process chunk, data_length: ${info.data.length}, info: `,
          info.info,
          info.config
        )
        for (let i = 0; i < info.data.length; i += maxinput) {
          const chunk = info.data.slice(i, i + maxinput)
          const inputContent = chunk.map(item => item.content)
          log.debug(
            `[embedding process] splitting chunks, total_chunks: ${info.data.length}, current_chunk: ${i}-${i + maxinput}, content_length: ${inputContent.length}`
          )
          inputContent.forEach((content, index) => {
            log.debug(
              `[embedding process] chunk content index: ${index}, length: ${content.length}, tokens: ${chunk[index].tokens}`
            )
          })
          asyncReqs.push(
            requestWithChunks(chunk, async () =>
              axios.request({
                url: info.config.embedding.api,
                method: info.config.embedding.method ?? "post",
                headers: {
                  Authorization: `Bearer ${info.config.embedding.apiKey}`,
                },
                data: {
                  model: info.config.embedding.model,
                  input: inputContent,
                  dimensions: info.config.dimensions,
                },
              })
            )
          )
        }
        log.debug(`[embedding process] start request, length: ${asyncReqs.length}`)
        const responses = await Promise.allSettled(asyncReqs)
        responses.forEach(res => {
          if (res.status === "fulfilled") {
            const { chunks, response } = res.value
            log.debug(`[embedding process] response: `, response.data, response.status, response.statusText)
            const data = response.data?.data
            const model = response.data?.model
            if (isArray(data)) {
              log.debug(`[embedding response] data_length: ${data.length} model: ${model}`)
              if (chunks.length !== data.length) {
                throw new Error(
                  `[embedding response] length of chunks doesn't match the length of returned data. ids_length: ${chunks.length} data_length: ${data.length}`
                )
              }
              data.forEach((vector, index) => {
                chunks[index].vector = vector.embedding
              })
              log.debug(
                `[embedding response]`,
                `file: ${info.info.path}\n total size: ${info.data.length}, chunk size: ${chunks.length}`
              )
            } else {
              const err = `[embedding response format error] ${errorToText(res.value)}`
              log.error(err)
              throw new Error(err)
            }
          } else {
            const err = `[embedding response error] ${errorToText(res.reason)}`
            log.error(err)
            throw new Error(err)
          }
        })
        statusResp.code = 200
        statusResp.msg = "ok"
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
