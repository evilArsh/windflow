import { ServiceCore } from "@main/types"
import { EventKey } from "@shared/types/eventbus"
import { EventBus, IpcChannel, RAGService } from "@shared/types/service"
import { useLanceDB } from "./db"
import fs from "node:fs"
import { RAGEmbeddingConfig, RAGLocalFileMeta, RAGSearchParam, RAGSearchResult } from "@shared/types/rag"
import { errorToText, merge, Response, responseCode, StatusResponse, uniqueId } from "@toolmain/shared"
import { ipcMain } from "electron"
import log from "electron-log"
import { createProcessStatus, ProcessStatus, TaskManager } from "./task"
import { fileTypeFromFile } from "file-type"
import path from "path"

export const RAGServiceId = "RAGService"
export class RAGServiceImpl implements RAGService, ServiceCore {
  #globalBus: EventBus
  #ss: ProcessStatus = createProcessStatus()
  #task: TaskManager
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
    this.#task = new TaskManager(this.#ss, this.#globalBus)
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
      this.#task.process({
        info: {
          ...meta,
          mimeType: ft?.mime || "application/octet-stream",
          fileName: path.basename(meta.path),
          fileSize: stat.size,
        },
        config: this.#emConfig,
      })
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
