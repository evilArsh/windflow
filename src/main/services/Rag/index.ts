import { ServiceCore } from "@main/types"
import { EventKey } from "@shared/types/eventbus"
import { EventBus, IpcChannel, RAGService } from "@shared/service"
import { initDB, LanceStore, LanceStoreConfig, TableName } from "./db"
import fs from "node:fs"
import { RAGEmbeddingConfig, RAGFile, RAGLocalFileInfo, RAGLocalFileMeta, RAGSearchParam } from "@shared/types/rag"
import { errorToText, isArray, Response, responseData, uniqueId } from "@toolmain/shared"
import { ipcMain } from "electron"
import { createProcessStatus, createTaskManager } from "./task"
import path from "path"
import { EmbeddingResponse, ProcessStatus, TaskManager } from "./task/types"
import axios from "axios"
import { useLog } from "@main/hooks/useLog"

export const RAGServiceId = "RAGService"

const log = useLog(RAGServiceId)

export type RAGServiceConfig = {
  store?: LanceStoreConfig
}
export class RAGServiceImpl implements RAGService, ServiceCore {
  #globalBus: EventBus
  #ss: ProcessStatus = createProcessStatus()
  #task: TaskManager
  #db: LanceStore
  constructor(globalBus: EventBus, config?: RAGServiceConfig) {
    this.#globalBus = globalBus
    this.#task = createTaskManager(this.#ss, this.#globalBus)
    this.#db = new LanceStore(config?.store)
  }
  async search(params: RAGSearchParam, config: RAGEmbeddingConfig): Promise<Response<RAGFile[]>> {
    try {
      const vectors = await axios.request<EmbeddingResponse>({
        url: config.embedding.api,
        method: config.embedding.method ?? "post",
        data: {
          model: config.embedding.model,
          input: params.content,
          dimensions: config.dimensions,
        },
      })
      if (!isArray(vectors.data?.data)) {
        throw new Error(`[rag search] Invalid embedding response. data: ${JSON.stringify(vectors.data)}`)
      }
      await this.#db.open()
      const res = await this.#db.query<any[]>({
        tableName: TableName.RAGFile,
        queryVector: vectors.data.data[0].embedding,
        topK: 5,
      })
      return {
        code: 200,
        msg: "ok",
        data: res,
      }
    } catch (error) {
      log.error("[embedding search error]", error)
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
      if (this.#ss.has(meta.path)) {
        return log.debug(`[processLocalFile] file already exists,status: ${this.#ss.get(meta.id)?.status}`)
      }
      const stat = fs.statSync(meta.path)
      if (!stat.isFile) {
        return log.error(`[processLocalFile] path ${meta.path} is not a file`)
      }
      const metaInfo: RAGLocalFileInfo = {
        ...meta,
        fileName: path.basename(meta.path),
        fileSize: stat.size,
      }
      log.debug("[processLocalFile] start ", metaInfo)
      this.#task.process(metaInfo, config)
    } catch (error) {
      log.debug("[processLocalFile]", errorToText(error))
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
  async registerIpc() {
    try {
      ipcMain.handle(IpcChannel.RagSearch, async (_, content: RAGSearchParam, config: RAGEmbeddingConfig) => {
        return this.search(content, config)
      })
      ipcMain.handle(IpcChannel.RagProcessLocalFile, async (_, file: RAGLocalFileMeta, config: RAGEmbeddingConfig) => {
        return this.processLocalFile(file, config)
      })
      await initDB(this.#db)
    } catch (error) {
      log.error("[RagService registerIpc error]", error)
      this.#globalBus.emit(EventKey.ServiceLog, {
        id: uniqueId(),
        service: RAGServiceId,
        details: {
          function: "registerIpc",
        },
        msg: errorToText(error),
        code: 500,
      })
    }
  }

  dispose() {
    this.#db.close()
    this.#task.close()
  }
}
