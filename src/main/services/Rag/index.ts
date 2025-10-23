import { ServiceCore } from "@main/types"
import { EventKey } from "@shared/types/eventbus"
import { EventBus, IpcChannel, RAGService } from "@shared/service"
import { VectorStore, VectorStoreConfig } from "./db"
import { RAGEmbeddingConfig, RAGFile, RAGLocalFileInfo, RAGLocalFileMeta, RAGSearchParam } from "@shared/types/rag"
import sql from "sqlstring"
import {
  errorToText,
  isArray,
  Response,
  responseCode,
  responseData,
  StatusResponse,
  toNumber,
  uniqueId,
} from "@toolmain/shared"
import { ipcMain } from "electron"
import { createProcessStatus, createTaskManager } from "./task"
import { EmbeddingResponse, ProcessStatus, RerankResponse, TaskChain, TaskManager } from "./task/types"
import axios from "axios"
import { useLog } from "@main/hooks/useLog"
import { Embedding } from "./task/embedding"
import { FileProcess } from "./task/file"
import { Store } from "./task/store"
import { combineTableName } from "./db/utils"
import { RAGServiceId } from "./vars"
import { getFileInfo } from "@main/misc/file"

export type RAGServiceConfig = {
  store?: VectorStoreConfig
}
export class RAGServiceImpl implements RAGService, ServiceCore {
  #globalBus: EventBus
  #ss: ProcessStatus = createProcessStatus()
  #task: TaskManager
  #db: VectorStore
  #fileTask: TaskChain
  #embeddingTask: TaskChain
  #dbTask: TaskChain
  #log = useLog(RAGServiceId)
  constructor(globalBus: EventBus, config?: RAGServiceConfig) {
    this.#globalBus = globalBus

    this.#task = createTaskManager(this.#ss, this.#globalBus)
    this.#db = new VectorStore(config?.store)

    this.#fileTask = new FileProcess(this.#task)
    this.#embeddingTask = new Embedding(this.#task)
    this.#dbTask = new Store(this.#task, this.#db)

    this.#task.addTaskChain(this.#fileTask)
    this.#task.addTaskChain(this.#embeddingTask)
    this.#task.addTaskChain(this.#dbTask)
  }
  async search(params: RAGSearchParam, config: RAGEmbeddingConfig): Promise<Response<RAGFile[]>> {
    try {
      console.time("[embedding timeout]")
      const vectors = await axios.request<EmbeddingResponse>({
        url: config.embedding.api,
        method: config.embedding.method ?? "post",
        headers: {
          Authorization: `Bearer ${config.embedding.apiKey}`,
        },
        data: {
          model: config.embedding.model,
          input: params.content,
          dimensions: config.dimensions,
        },
      })
      console.timeEnd("[embedding timeout]")
      if (!isArray(vectors.data?.data)) {
        throw new Error(`[embedding search] Invalid embedding response. data: ${JSON.stringify(vectors.data)}`)
      }
      this.#log.debug(
        `[embedding search] content translated to vectors`,
        `content: [${params.content}], token_usage: ${vectors.data.usage?.total_tokens}, vectors-length: ${vectors.data.data.length}, model: ${config.embedding.model}`
      )
      await this.#db.open()
      console.time("[search timeout]")
      const res = await this.#db.query({
        tableName: combineTableName(params.topicId),
        topicId: params.topicId,
        queryVector: vectors.data.data[0].embedding,
      })
      console.timeEnd("[search timeout]")
      this.#log.debug(`[embedding search] query result, length: ${res.length}, topicId: ${params.topicId}`)
      if (config.rerank) {
        this.#log.debug(
          `[embedding search] will rerank result, topicId: ${params.topicId}, rerank_provider: ${config.rerank.providerName}, rerank_model: ${config.rerank.model}`
        )
        const rerankRes = await axios.request<RerankResponse>({
          url: config.rerank.api,
          method: config.rerank.method ?? "post",
          headers: {
            Authorization: `Bearer ${config.rerank.apiKey}`,
          },
          data: {
            model: config.rerank.model,
            query: params.content,
            documents: res.map(item => item.content),
          },
        })
        const maxRanksIndex = rerankRes.data.results.reduce(
          (prev, curr) => {
            if (!prev) {
              return curr
            }
            if (curr.relevance_score > prev.relevance_score) {
              return curr
            }
            return prev
          },
          null as RerankResponse["results"][number] | null
        )
        if (!maxRanksIndex) {
          return { code: 200, msg: "", data: [] }
        }
        this.#log.debug("[embedding rerank]", res[maxRanksIndex.index])
        return { code: 200, msg: "", data: [res[maxRanksIndex.index]] }
      } else {
        const results = res.sort((a, b) => toNumber(b._distance) - toNumber(a._distance))
        this.#log.debug(
          `[embedding search finish] total_length: ${res.length}, score_gt_0.7_length: ${
            res.filter(r => toNumber(r._distance) >= 0.7).length
          }`
        )
        return { code: 200, msg: "ok", data: results }
      }
    } catch (error) {
      this.#log.error("[embedding search error]", error)
      this.#globalBus.emit(EventKey.ServiceLog, {
        id: uniqueId(),
        service: RAGServiceId,
        details: {
          function: "search",
          args: params,
        },
        msg: errorToText(error),
        code: 500,
      })
      return responseData(500, errorToText(error), [])
    }
  }
  async processLocalFile(meta: RAGLocalFileMeta, config: RAGEmbeddingConfig): Promise<void> {
    try {
      if (!meta.path) {
        throw new Error("[processLocalFile] file path is empty")
      }
      // FIXME: the same file may exist in multiple topics
      if (this.#ss.has(meta.path)) {
        return this.#log.debug(`[processLocalFile] file already exists,status: ${this.#ss.get(meta.id)?.status}`)
      }
      const info = await getFileInfo(meta.path)
      if (!info.isFile) {
        return this.#log.error(`[processLocalFile] path ${meta.path} is not a file`)
      }
      const metaInfo: RAGLocalFileInfo = {
        ...meta,
        ...info,
        fileName: info.name,
        fileSize: info.size,
      }
      this.#log.debug("[processLocalFile] start ", metaInfo)
      this.#task.process(metaInfo, config)
    } catch (error) {
      this.#log.debug("[processLocalFile]", errorToText(error))
      this.#globalBus.emit(EventKey.ServiceLog, {
        id: uniqueId(),
        service: RAGServiceId,
        details: {
          function: "processLocalFile",
          args: meta,
        },
        msg: errorToText(error),
        code: 500,
      })
    }
  }
  async removeById(topicId: string, fileId: string): Promise<Response<number>> {
    try {
      const res = await this.#db.deleteData(combineTableName(topicId), sql.format(`\`fileId\` = ?`, [fileId]))
      return responseData(200, "ok", res)
    } catch (error) {
      this.#log.debug("[removeById]", errorToText(error))
      this.#globalBus.emit(EventKey.ServiceLog, {
        id: uniqueId(),
        service: RAGServiceId,
        details: {
          function: "removeById",
          args: { topicId, fileId },
        },
        msg: errorToText(error),
        code: 500,
      })
      return responseData(500, errorToText(error), 0)
    }
  }
  async removeByTopicId(topicId: string): Promise<StatusResponse> {
    try {
      await this.#db.deleteTable(combineTableName(topicId))
      return responseCode(200, "success")
    } catch (error) {
      this.#log.debug("[removeById]", errorToText(error))
      this.#globalBus.emit(EventKey.ServiceLog, {
        id: uniqueId(),
        service: RAGServiceId,
        details: {
          function: "removeByTopicId",
          args: { topicId },
        },
        msg: errorToText(error),
        code: 500,
      })
      return responseCode(500, errorToText(error))
    }
  }
  async registerIpc() {
    ipcMain.handle(IpcChannel.RagSearch, async (_, content: RAGSearchParam, config: RAGEmbeddingConfig) => {
      return this.search(content, config)
    })
    ipcMain.handle(IpcChannel.RagProcessLocalFile, async (_, file: RAGLocalFileMeta, config: RAGEmbeddingConfig) => {
      return this.processLocalFile(file, config)
    })
    ipcMain.handle(IpcChannel.RagRemoveById, async (_, topicId: string, fileId: string) => {
      return this.removeById(topicId, fileId)
    })
    ipcMain.handle(IpcChannel.RagRemoveByTopicId, async (_, topicId: string) => {
      return this.removeByTopicId(topicId)
    })
  }

  dispose() {
    this.#db.close()
    this.#task.close()
  }
}
