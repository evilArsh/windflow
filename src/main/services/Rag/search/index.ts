import { RAGEmbeddingConfig, RAGFile, RAGSearchParam, RagSearchStatus, RAGSearchTask } from "@shared/types/rag"
import { errorToText, HttpStatusCode, isArray, isNull, toNumber } from "@toolmain/shared"
import { EmbeddingResponse, RerankResponse } from "../task/types"
import { log } from "../vars"
import { VectorStore } from "../db"
import { combineTableName } from "../db/utils"
import EventEmitter from "node:events"
import { useRequest } from "./request"

// export enum RagSearchStatus {
//   Pending = "pending",
//   Success = "success",
//   Failed = "failed",
//   Aborted = "aborted",
// }
// export type RAGSearchTask = RAGSearchParam & {
//   status: RagSearchStatus
//   msg?: string
//   code?: HttpStatusCode
//   controler?: AbortController
//   result?: RAGFile[]
// }
export function useSearchManager(db: VectorStore) {
  const http = useRequest()
  const ev = new EventEmitter()
  const taskStatus = new Map<string, RAGSearchTask>()
  const transformEmbedding = (params: RAGSearchParam, config: RAGEmbeddingConfig, signal?: AbortSignal) => {
    const { abort, pending } = http.request<EmbeddingResponse>({
      url: config.embedding.api,
      method: config.embedding.method ?? "post",
      signal,
      headers: {
        Authorization: `Bearer ${config.embedding.apiKey}`,
      },
      data: {
        model: config.embedding.model,
        input: params.content,
        dimensions: config.dimensions,
      },
    })
    return { abort, pending }
  }
  const transformRerank = (
    params: RAGSearchParam,
    config: RAGEmbeddingConfig,
    content: string[],
    signal?: AbortSignal
  ) => {
    if (!config.rerank) return
    log.debug(
      `[embedding search] will rerank result, topicId: ${params.topicId}, rerank_provider: ${config.rerank.providerName}, rerank_model: ${config.rerank.model}`
    )
    const { abort, pending } = http.request<RerankResponse>({
      url: config.rerank.api,
      method: config.rerank.method ?? "post",
      signal,
      headers: {
        Authorization: `Bearer ${config.rerank.apiKey}`,
      },
      data: {
        model: config.rerank.model,
        query: params.content,
        documents: content,
      },
    })
    return { abort, pending }
  }
  const emitStatus = (
    sessionId: string,
    status: RagSearchStatus,
    code: HttpStatusCode,
    msg: string,
    result: RAGFile[]
  ) => {
    const task = taskStatus.get(sessionId)
    if (!task) return
    task.status = status
    task.code = code
    task.msg = msg
    task.result = result
    task.controler = undefined
    ev.emit(sessionId, task)
  }
  const startTask = async (params: RAGSearchParam, config: RAGEmbeddingConfig) => {
    console.time("[vector search]")
    const abortController = new AbortController()
    taskStatus.set(params.sessionId, {
      ...params,
      status: RagSearchStatus.Pending,
      controler: abortController,
      result: [],
    })
    try {
      const embeddingReq = transformEmbedding(params, config, abortController.signal)
      const vectors = await embeddingReq.pending
      if (!isArray(vectors.data?.data)) {
        throw new Error(`[embedding search] Invalid embedding response. data: ${JSON.stringify(vectors.data)}`)
      }
      log.debug(
        `[embedding search] content translated to vectors`,
        `content: [${params.content}], token_usage: ${vectors.data.usage?.total_tokens}, vectors-length: ${vectors.data.data.length}, model: ${config.embedding.model}`
      )
      await db.open()
      const vectorSearchRes = await db.query({
        tableName: combineTableName(params.topicId),
        topicId: params.topicId,
        queryVector: vectors.data.data[0].embedding,
      })
      log.debug(`[embedding search] query result, length: ${vectorSearchRes.length}, topicId: ${params.topicId}`)
      const rerankReq = transformRerank(
        params,
        config,
        vectorSearchRes.map(i => i.content),
        abortController.signal
      )
      if (rerankReq) {
        const rerankRes = await rerankReq.pending
        const maxRanksIndex = rerankRes.data.results.reduce(
          (prev, cur) => {
            if (!prev) return cur
            if (cur.relevance_score > prev.relevance_score) return cur
            return prev
          },
          null as RerankResponse["results"][number] | null
        )
        const result = isNull(maxRanksIndex) ? [] : [vectorSearchRes[maxRanksIndex.index]]
        log.debug("[embedding rerank result]", result)
        emitStatus(params.sessionId, RagSearchStatus.Success, 200, "ok", result)
      } else {
        const results = vectorSearchRes.sort((a, b) => toNumber(b._distance) - toNumber(a._distance))
        log.debug(
          `[embedding search finish] total_length: ${vectorSearchRes.length}, score_gt_0.7_length: ${
            vectorSearchRes.filter(r => toNumber(r._distance) >= 0.7).length
          }`
        )
        emitStatus(params.sessionId, RagSearchStatus.Success, 200, "ok", results)
      }
    } catch (error) {
      log.error(
        `[embedding search task error] sessionId: ${params.sessionId}, content: ${params.content}, topicId: ${params.topicId}`,
        error
      )
      const errorText = errorToText(error)
      if (abortController.signal.aborted) {
        emitStatus(params.sessionId, RagSearchStatus.Aborted, 500, errorText, [])
      } else {
        emitStatus(params.sessionId, RagSearchStatus.Failed, 500, errorText, [])
      }
    } finally {
      console.timeEnd("[vector search]")
    }
  }
  function addSearchTask(params: RAGSearchParam, config: RAGEmbeddingConfig) {
    const oldTask = taskStatus.get(params.sessionId)
    if (oldTask && oldTask.status === RagSearchStatus.Pending) {
      if (oldTask.controler && !oldTask.controler.signal.aborted) {
        oldTask.controler.signal.addEventListener("abort", () => {
          taskStatus.delete(params.sessionId)
          startTask(params, config)
        })
        oldTask.controler.abort()
      } else {
        startTask(params, config)
      }
    } else {
      startTask(params, config)
    }
  }
  async function getSearchResult(sessionId: string): Promise<RAGSearchTask> {
    return new Promise((resolve, reject) => {
      const task = taskStatus.get(sessionId)
      if (!task) {
        reject(new Error(`[embedding search] task not found, sessionId: ${sessionId}`))
        return
      }
      if (task.status !== RagSearchStatus.Pending) {
        resolve(task)
        taskStatus.delete(sessionId)
        return
      }
      ev.once(sessionId, (task: RAGSearchTask) => {
        resolve(task)
        taskStatus.delete(sessionId)
      })
    })
  }
  async function stopSearchTask(sessionId: string) {
    const controller = taskStatus.get(sessionId)?.controler
    if (controller && !controller.signal.aborted) {
      return new Promise<void>(resolve => {
        controller.signal.addEventListener("abort", _ => resolve())
        controller.abort()
      })
    }
  }
  function getTask(sessionId: string) {
    return taskStatus.get(sessionId)
  }

  return {
    addSearchTask,
    getSearchResult,
    stopSearchTask,
    getTask,
  }
}
