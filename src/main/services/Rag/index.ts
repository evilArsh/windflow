import { ServiceCore } from "@main/types"
import { EventKey } from "@shared/types/eventbus"
import { EventBus, IpcChannel, RAGService } from "@shared/types/service"
import { useLanceDB } from "./db"
import fs from "node:fs"
import {
  RAGEmbeddingConfig,
  RAGFileProcessStatus,
  RAGLocalFileMeta,
  RAGLocalFileProcess,
  RAGSearchParam,
  RAGSearchResult,
} from "@shared/types/rag"
import {
  code4xx,
  code5xx,
  errorToText,
  merge,
  Response,
  responseCode,
  StatusResponse,
  uniqueId,
} from "@toolmain/shared"
import { ipcMain } from "electron"
import log from "electron-log"
import { createProcessStatus, ProcessStatus } from "./task"
import { fileTypeFromFile } from "file-type"
import path from "path"
import { readFile } from "./doc"

export const RAGServiceId = "RAGService"
export class RAGServiceImpl implements RAGService, ServiceCore {
  #globalBus: EventBus
  #ss: ProcessStatus = createProcessStatus()
  #emConfig: RAGEmbeddingConfig = {
    embedding: {
      providerName: "",
      model: "",
      api: "",
    },
    dimensions: 1024,
    maxChunks: 512,
    maxTokens: 512,
  }
  #db = useLanceDB()
  constructor(globalBus: EventBus) {
    this.#globalBus = globalBus
  }
  async updateEmbedding(config: RAGEmbeddingConfig): Promise<StatusResponse> {
    this.#emConfig = merge({}, this.#emConfig, config)
    return responseCode(200, "ok")
  }
  async search(content: RAGSearchParam): Promise<Response<RAGSearchResult | null>> {
    return {
      code: 200,
      msg: "",
      data: null,
    }
  }
  async processLocalFile(meta: RAGLocalFileMeta): Promise<void> {
    try {
      if (this.#ss.has(meta.id)) {
        return log.debug(`[processLocalFile] file already exists,status: ${this.#ss.get(meta.id)?.status}`)
      }
      const ft = await fileTypeFromFile(meta.path)
      if (fs.existsSync(meta.path)) {
        return log.error(`[processLocalFile] path ${meta.path} not exists`)
      }
      const stat = fs.statSync(meta.path)
      if (!stat.isFile) {
        return log.error(`[processLocalFile] path ${meta.path} is not a file`)
      }
      const data: RAGLocalFileProcess = {
        ...meta,
        status: RAGFileProcessStatus.Pending,
        mimeType: ft?.mime || "application/octet-stream",
        fileName: path.basename(meta.path),
        fileSize: stat.size,
      }
      this.#globalBus.emit(EventKey.RAGFileProcessStatus, data)
      const chunksData = await readFile(data, this.#emConfig)
      if (code4xx(chunksData.code) || code5xx(chunksData.code)) {
        data.status = RAGFileProcessStatus.Failed
        this.#globalBus.emit(EventKey.RAGFileProcessStatus, data)
      } else {
        this.#ss.set(meta.id, data)
        // todo
      }
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
  registerIpc() {
    ipcMain.handle(IpcChannel.RagUpdateEmbedding, async (_, config: RAGEmbeddingConfig) => {
      return this.updateEmbedding(config)
    })
    ipcMain.handle(IpcChannel.RagSearch, async (_, content: RAGSearchParam) => {
      return this.search(content)
    })
    ipcMain.handle(IpcChannel.RagProcessLocalFile, async (_, file: RAGLocalFileMeta) => {
      return this.processLocalFile(file)
    })
  }

  dispose() {
    this.#db.close()
  }
}
