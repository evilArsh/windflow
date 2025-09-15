import { ServiceCore } from "@main/types"
import { EventKey } from "@shared/types/eventbus"
import { EventBus, IpcChannel, RAGService } from "@shared/types/service"
import { useLanceDB } from "./db"
import { RAGEmbeddingConfig, RAGFileUpload, RAGSearchParam, RAGSearchResult } from "@shared/types/rag"
import { cloneDeep, Response, responseCode, StatusResponse } from "@toolmain/shared"
import { ipcMain } from "electron"

export const useRAG = (globalBus: EventBus): RAGService & ServiceCore => {
  const db = useLanceDB()
  let emConfig: RAGEmbeddingConfig | undefined

  async function updateEmbedding(config: RAGEmbeddingConfig): Promise<StatusResponse> {
    emConfig = cloneDeep(config)
    return responseCode(200, "ok")
  }

  async function search(content: RAGSearchParam): Promise<Response<RAGSearchResult | null>> {
    return {
      code: 200,
      msg: "",
      data: null,
    }
  }

  async function processFile(file: RAGFileUpload): Promise<void> {}

  function registerIpc() {
    ipcMain.handle(IpcChannel.RagUpdateEmbedding, async (_, config: RAGEmbeddingConfig) => {
      return updateEmbedding(config)
    })
    ipcMain.handle(IpcChannel.RagSearch, async (_, content: RAGSearchParam) => {
      return search(content)
    })
    ipcMain.handle(IpcChannel.RagProcessFile, async (_, file: RAGFileUpload) => {
      return processFile(file)
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
    processFile,
  }
}
