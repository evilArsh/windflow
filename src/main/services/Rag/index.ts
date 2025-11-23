import { ServiceCore } from "@main/types"
import { EventKey } from "@shared/types/eventbus"
import { EventBus, IpcChannel, RAGService } from "@shared/service"
import { VectorStore, VectorStoreConfig } from "./db"
import {
  RAGEmbeddingConfig,
  RAGFile,
  RAGFileStatus,
  RAGLocalFileMeta,
  RAGSearchParam,
  RagSearchStatus,
  RAGSearchTask,
} from "@shared/types/rag"
import sql from "sqlstring"
import {
  cloneDeep,
  errorToText,
  Response,
  responseCode,
  responseData,
  StatusResponse,
  toNumber,
  uniqueId,
} from "@toolmain/shared"
import { ipcMain } from "electron"
import { createProcessStatus, createTaskManager } from "./task"
import { useSearchManager } from "./search/index"
import { ProcessStatus, TaskChain, TaskManager } from "./task/types"
import { EmbeddingTaskImpl } from "./task/embedding"
import { FileProcessTaskImpl } from "./task/file"
import { StoreTaskImpl } from "./task/store"
import { combineTableName } from "./db/utils"
import { log, RAGServiceId } from "./vars"
import { getFileInfo } from "@main/misc/file"
import { FileInfo } from "@shared/types/files"

export type RAGServiceConfig = {
  store?: VectorStoreConfig
}
export class RAGServiceImpl implements RAGService, ServiceCore {
  #globalBus: EventBus
  #ss: ProcessStatus
  #search: ReturnType<typeof useSearchManager>
  #task: TaskManager
  #db: VectorStore
  #fileTask: TaskChain
  #embeddingTask: TaskChain
  #dbTask: TaskChain
  constructor(globalBus: EventBus, config?: RAGServiceConfig) {
    this.#globalBus = globalBus
    this.#ss = createProcessStatus()

    this.#task = createTaskManager(this.#ss, this.#globalBus)
    this.#db = new VectorStore(config?.store)

    this.#fileTask = new FileProcessTaskImpl()
    this.#embeddingTask = new EmbeddingTaskImpl()
    this.#dbTask = new StoreTaskImpl(this.#db)

    this.#task.addTaskChain(this.#fileTask)
    this.#task.addTaskChain(this.#embeddingTask)
    this.#task.addTaskChain(this.#dbTask)

    this.#search = useSearchManager(this.#db)
  }
  async search(params: RAGSearchParam, config: RAGEmbeddingConfig): Promise<Response<RAGFile[]>> {
    try {
      this.#search.addSearchTask(params, config)
      const res = await this.#search.getSearchResult(params.sessionId)
      if (res.status === RagSearchStatus.Success) {
        return responseData(200, "ok", cloneDeep(res.result ?? []))
      }
      return responseData(res.code ?? 500, res.msg ?? "search error", [])
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
  async searchTerminate(sessionId: string): Promise<Response<RAGSearchTask | undefined>> {
    const task = this.#search.getTask(sessionId)
    try {
      if (!task) {
        return responseData(404, "task not found", task)
      }
      if (task.status === RagSearchStatus.Pending) {
        await this.#search.stopSearchTask(sessionId)
        return responseData(200, "task terminated", task)
      }
      return responseData(204, "task is not pending", task)
    } catch (error) {
      return responseData(500, errorToText(error), task)
    }
  }
  async processLocalFile(meta: RAGLocalFileMeta, config: RAGEmbeddingConfig): Promise<void> {
    let info: FileInfo | undefined
    try {
      if (!meta.path) {
        throw new Error("[processLocalFile] file path is empty")
      }
      info = await getFileInfo(meta.path)
      if (!info.isFile) {
        return log.error(`[processLocalFile] path ${meta.path} is not a file`)
      }
      await this.#task.process(
        {
          ...meta,
          ...info,
          fileName: info.name,
          fileSize: info.size,
        },
        config
      )
    } catch (error) {
      log.debug("[processLocalFile error]", errorToText(error))
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
      this.#globalBus.emit(EventKey.RAGFileProcessStatus, {
        ...meta,
        status: RAGFileStatus.Failed,
        code: 500,
        msg: errorToText(error),
        fileName: info?.name ?? "",
        fileSize: toNumber(info?.size),
      })
    }
  }
  async restart(meta: RAGLocalFileMeta, config: RAGEmbeddingConfig): Promise<void> {
    try {
      this.#task.stop(meta)
      return this.processLocalFile(meta, config)
    } catch (error) {
      this.#globalBus.emit(EventKey.ServiceLog, {
        id: uniqueId(),
        service: RAGServiceId,
        details: {
          function: "restart",
          args: { meta },
        },
        msg: errorToText(error),
        code: 500,
      })
    }
  }
  async removeById(topicId: string, fileId: string): Promise<Response<number>> {
    try {
      await this.#db.open()
      const res = await this.#db.deleteData(combineTableName(topicId), sql.format(`\`fileId\` = ?`, [fileId]))
      log.debug(
        `[removeById] delete ${res} rows, tableName:${combineTableName(topicId)}, topicId:${topicId}, fileId:${fileId}`
      )
      return responseData(200, "ok", res)
    } catch (error) {
      log.debug("[removeById]", errorToText(error))
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
      await this.#db.open()
      await this.#db.deleteTable(combineTableName(topicId))
      log.debug(`[removeByTopicId] table ${combineTableName(topicId)} deleted`)
      return responseCode(200, "success")
    } catch (error) {
      log.debug("[removeById]", errorToText(error))
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
    ipcMain.handle(IpcChannel.RagSearchTerminate, async (_, sessionId: string) => {
      return this.searchTerminate(sessionId)
    })
    ipcMain.handle(IpcChannel.RagProcessLocalFile, async (_, file: RAGLocalFileMeta, config: RAGEmbeddingConfig) => {
      return this.processLocalFile(file, config)
    })
    ipcMain.handle(IpcChannel.RagRestart, async (_, file: RAGLocalFileMeta, config: RAGEmbeddingConfig) => {
      return this.restart(file, config)
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
    this.#task.stop()
  }
}
