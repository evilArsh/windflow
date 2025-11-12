import PQueue from "p-queue"
import { RAGEmbeddingConfig, RAGFile, RAGSearchParam } from "@shared/types/rag"
import { cloneDeep, errorToText, isArray, toNumber } from "@toolmain/shared"
import { EmbeddingResponse, RerankResponse } from "../task/types"
import { log } from "../vars"
import { VectorStore } from "../db"
import { combineTableName } from "../db/utils"
import EventEmitter from "node:events"
import { useRequest } from "./request"

export enum SearchTaskStatus {
  Pending = "pending",
  Success = "success",
  Failed = "failed",
  Aborted = "aborted",
}
export type SearchTask = RAGSearchParam & {
  status: SearchTaskStatus
  result?: RAGFile[]
}
export function useSearchManager(db: VectorStore) {
  const queue = new PQueue()
  const http = useRequest()
  const ev = new EventEmitter()
  const taskStatus: Record<string, SearchTask> = {}
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

  async function addSearchTask(params: RAGSearchParam, config: RAGEmbeddingConfig) {
    taskStatus[params.sessionId] = {
      ...params,
      status: SearchTaskStatus.Pending,
      result: [],
    }
    queue.add(
      async ({ signal }) => {
        try {
          const embeddingReq = transformEmbedding(params, config, signal)
          console.time("[embedding transform]")
          const vectors = await embeddingReq.pending
          console.timeEnd("[embedding transform]")
          if (!isArray(vectors.data?.data)) {
            throw new Error(`[embedding search] Invalid embedding response. data: ${JSON.stringify(vectors.data)}`)
          }
          log.debug(
            `[embedding search] content translated to vectors`,
            `content: [${params.content}], token_usage: ${vectors.data.usage?.total_tokens}, vectors-length: ${vectors.data.data.length}, model: ${config.embedding.model}`
          )
          await db.open()
          console.time("[vector search]")
          const vectorSearchRes = await db.query({
            tableName: combineTableName(params.topicId),
            topicId: params.topicId,
            queryVector: vectors.data.data[0].embedding,
          })
          console.timeEnd("[vector search]")
          log.debug(`[embedding search] query result, length: ${vectorSearchRes.length}, topicId: ${params.topicId}`)
          const rerankReq = transformRerank(
            params,
            config,
            vectorSearchRes.map(i => i.content),
            signal
          )
          if (rerankReq) {
            console.time("[rerank transform]")
            const rerankRes = await rerankReq.pending
            console.timeEnd("[rerank transform]")
            const maxRanksIndex = rerankRes.data.results.reduce(
              (prev, cur) => {
                if (!prev) return cur
                if (cur.relevance_score > prev.relevance_score) return cur
                return prev
              },
              null as RerankResponse["results"][number] | null
            )
            if (!maxRanksIndex) return { code: 200, msg: "", data: [] }
            log.debug("[embedding rerank]", vectorSearchRes[maxRanksIndex.index])
            return { code: 200, msg: "", data: cloneDeep([vectorSearchRes[maxRanksIndex.index]]) }
          } else {
            const results = vectorSearchRes.sort((a, b) => toNumber(b._distance) - toNumber(a._distance))
            log.debug(
              `[embedding search finish] total_length: ${vectorSearchRes.length}, score_gt_0.7_length: ${
                vectorSearchRes.filter(r => toNumber(r._distance) >= 0.7).length
              }`
            )
            return { code: 200, msg: "ok", data: results }
          }
        } catch (error) {
          log.error(
            `[embedding search task error] sessionId: ${params.sessionId}, content: ${params.content}, topicId: ${params.topicId}`,
            error
          )
          return { code: 500, msg: errorToText(error), data: [] }
        }
      },
      {
        id: params.sessionId,
      }
    )
  }

  return {
    addSearchTask,
  }
}
