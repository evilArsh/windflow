import { RAGFile, RAGSearchParam, RagSearchStatus, RAGSearchTask } from "@shared/types/rag"
import { errorToText, HttpStatusCode, isArray, isArrayLength, isNull, toNumber } from "@toolmain/shared"
import { EmbeddingResponse, RerankResponse } from "../task/types"
import { encapEmbeddinConfig, log } from "../utils"
import { VectorStore } from "../db"
import { combineTableName } from "../db/utils"
import EventEmitter from "node:events"
import { useRequest } from "./request"
export function useSearchManager(db: VectorStore) {
  const http = useRequest()
  const ev = new EventEmitter()
  const taskStatus = new Map<string, RAGSearchTask>()
  const transformEmbedding = (params: RAGSearchParam, signal?: AbortSignal) => {
    return params.configs.map(({ config }) => {
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
    })
  }
  const transformRerank = (params: RAGSearchParam, content: string[][], signal?: AbortSignal) => {
    return params.configs
      .map(({ config }, index) => {
        if (!config.rerank) return
        log.debug(`[embedding search] will rerank result.`, params, encapEmbeddinConfig(config))
        const { api, apiKey, model } = config.rerank
        if (!(api && apiKey && model)) return
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
            documents: content[index],
          },
        })
        return { abort, pending }
      })
      .filter(r => !!r)
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
  const startTask = async (params: RAGSearchParam) => {
    log.debug("[vector search start]", params, params.configs.map(c => c.config).forEach(encapEmbeddinConfig))
    console.time("[vector search]")
    const abortController = new AbortController()
    taskStatus.set(params.sessionId, {
      ...params,
      status: RagSearchStatus.Pending,
      controler: abortController,
      result: [],
    })
    try {
      const embeddingReqs = transformEmbedding(params, abortController.signal)
      const vectors = await Promise.all(embeddingReqs.map(r => r.pending))
      const except = vectors.find(v => !isArray(v.data.data))
      if (except) {
        throw new Error(`[embedding search] invalid embedding response. data: ${JSON.stringify(except)}`)
      }
      vectors.forEach(vector => {
        log.debug(
          `[embedding search] content translated to vectors`,
          `content: [${params.content}], token_usage: ${vector.data.usage?.total_tokens}, vectors-length: ${vector.data.data?.length}`
        )
      })
      await db.open()
      const searchReq: Array<Promise<RAGFile[]>> = []
      params.configs.forEach((config, index) => {
        searchReq.push(
          db.search({
            tableName: combineTableName(config.topicId),
            queryVector: vectors[index].data.data?.[0].embedding ?? [],
            topicId: config.topicId,
          })
        )
      })
      const vectorSearchRes = await Promise.all(searchReq)
      log.debug(`[embedding search] search complete, total count: ${vectorSearchRes.length}`)
      const rerankReq = transformRerank(
        params,
        vectorSearchRes.map(vectors => vectors.map(v => v.content)),
        abortController.signal
      )
      if (isArrayLength(rerankReq)) {
        const rerankResRaws = await Promise.all(rerankReq.map(r => r.pending))
        const results = rerankResRaws.map((rerankRes, index) => {
          const maxRanksIndex = rerankRes.data.results.reduce<RerankResponse["results"][number] | null>((prev, cur) => {
            if (!prev) return cur
            if (cur.relevance_score > prev.relevance_score) return cur
            return prev
          }, null)
          return isNull(maxRanksIndex) ? [] : [vectorSearchRes[index][maxRanksIndex.index]]
        })
        log.debug("[embedding rerank result]", results)
        emitStatus(params.sessionId, RagSearchStatus.Success, 200, "ok", results.flat())
      } else {
        const results = vectorSearchRes.flat().sort((a, b) => toNumber(b._distance) - toNumber(a._distance))
        log.debug(
          `[embedding search finish] total_length: ${vectorSearchRes.length}, score_gt_0.7_length: ${
            vectorSearchRes.flat().filter(r => toNumber(r._distance) >= 0.7).length
          }`
        )
        emitStatus(params.sessionId, RagSearchStatus.Success, 200, "ok", results.flat())
      }
    } catch (error) {
      log.error(
        `[embedding search task error] sessionId: ${params.sessionId}, content: ${params.content}, topicId: ${params.configs.map(c => c.topicId).join()}`,
        error
      )
      const errorText = errorToText(error)
      if (abortController.signal.aborted) {
        emitStatus(params.sessionId, RagSearchStatus.Aborted, 500, errorText, [])
      } else {
        emitStatus(params.sessionId, RagSearchStatus.Failed, 500, errorText, [])
      }
    }
    console.timeEnd("[vector search]")
  }
  function addSearchTask(params: RAGSearchParam) {
    const oldTask = taskStatus.get(params.sessionId)
    if (oldTask && oldTask.status === RagSearchStatus.Pending) {
      if (oldTask.controler && !oldTask.controler.signal.aborted) {
        oldTask.controler.signal.addEventListener("abort", () => {
          taskStatus.delete(params.sessionId)
          startTask(params)
        })
        oldTask.controler.abort()
      } else {
        startTask(params)
      }
    } else {
      startTask(params)
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
