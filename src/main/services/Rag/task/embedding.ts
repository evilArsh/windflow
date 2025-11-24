import { RAGFile, RAGFileStatus, RAGLocalFileMeta } from "@shared/types/rag"
import PQueue from "p-queue"
import { EmbeddingResponse, TaskChain, TaskInfo, TaskInfoStatus, TaskManager } from "./types"
import axios, { AxiosResponse } from "axios"
import { errorToText, isArray, toNumber } from "@toolmain/shared"
import { encapEmbeddinConfig, log } from "../utils"
import { combineUniqueId } from "./utils"

const requestWithChunks = async <T>(
  chunks: RAGFile[],
  request: () => Promise<T>
): Promise<{ chunks: RAGFile[]; response: T }> => {
  const response = await request()
  return { chunks, response }
}
export class EmbeddingTaskImpl implements TaskChain {
  #queue: PQueue
  #meta: Map<string, AbortController>
  constructor() {
    this.#queue = new PQueue({ concurrency: 5 })
    this.#meta = new Map()
  }
  taskId() {
    return "task_embedding"
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
          if (!info.data.length) {
            throw new Error("[embedding process], no data to process")
          }
          const maxinput = toNumber(info.config.maxInputs)
          if (!maxinput || !info.data.length) {
            throw new Error(
              `[embedding process] inputs is invalid, max_inputs: ${maxinput}, data_length: ${info.data.length}`
            )
          }
          const asyncReqs: Array<Promise<{ chunks: RAGFile[]; response: Awaited<AxiosResponse<EmbeddingResponse>> }>> =
            []
          log.debug(
            `[embedding process] start process chunk, data_length: ${info.data.length}, info: `,
            info.info,
            encapEmbeddinConfig(info.config)
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
          const responses = await Promise.all(asyncReqs)
          responses.forEach(res => {
            const { chunks, response } = res
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
              const err = `[embedding response format error] ${errorToText(res)}`
              log.error(err)
              throw new Error(err)
            }
          })
          statusResp.status = RAGFileStatus.Success
          statusResp.code = 200
          statusResp.msg = "ok"
          if (signal?.aborted) {
            statusResp.msg = "aborted"
            statusResp.status = RAGFileStatus.Failed
            statusResp.code = 499
          }
        } catch (error) {
          log.error("[embedding process error]", errorToText(error))
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
