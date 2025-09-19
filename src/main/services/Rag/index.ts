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
import { useFile } from "./doc"
import { useStatus } from "./doc/utils"
import { fileTypeFromFile } from "file-type"
import path from "path"

export const RAGServiceId = "RAGService"
export const useRAG = (globalBus: EventBus): RAGService & ServiceCore => {
  const status = useStatus()

  let emConfig: RAGEmbeddingConfig = {
    embedding: {
      providerName: "",
      model: "",
      api: "",
    },
    dimensions: 1024,
    maxChunks: 512,
    maxTokens: 512,
  }
  const db = useLanceDB()
  const file = useFile()

  async function updateEmbedding(config: RAGEmbeddingConfig): Promise<StatusResponse> {
    emConfig = merge({}, emConfig, config)
    return responseCode(200, "ok")
  }

  async function search(content: RAGSearchParam): Promise<Response<RAGSearchResult | null>> {
    return {
      code: 200,
      msg: "",
      data: null,
    }
  }

  async function processLocalFile(meta: RAGLocalFileMeta): Promise<void> {
    try {
      if (status.has(meta.id)) {
        return log.debug(`[processLocalFile] file already exists,status: ${status.get(meta.id)?.status}`)
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
      globalBus.emit(EventKey.RAGFileProcessStatus, data)
      const chunksData = await file.readFile(emConfig, data)
      if (code4xx(chunksData.code) || code5xx(chunksData.code)) {
        data.status = RAGFileProcessStatus.Failed
        globalBus.emit(EventKey.RAGFileProcessStatus, data)
      } else {
        status.set(meta.id, data)
        // todo
      }
    } catch (error) {
      log.debug("[processLocalFile]", errorToText(error))
      globalBus.emit(EventKey.ServiceLog, {
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

  function registerIpc() {
    ipcMain.handle(IpcChannel.RagUpdateEmbedding, async (_, config: RAGEmbeddingConfig) => {
      return updateEmbedding(config)
    })
    ipcMain.handle(IpcChannel.RagSearch, async (_, content: RAGSearchParam) => {
      return search(content)
    })
    ipcMain.handle(IpcChannel.RagProcessLocalFile, async (_, file: RAGLocalFileMeta) => {
      return processLocalFile(file)
    })
  }

  function dispose() {
    db.close()
  }

  return {
    registerIpc,
    dispose,
    updateEmbedding,
    search,
    processLocalFile,
  }
}
