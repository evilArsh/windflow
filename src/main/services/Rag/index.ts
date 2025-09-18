import { ServiceCore } from "@main/types"
import { EventKey } from "@shared/types/eventbus"
import { EventBus, IpcChannel, RAGService } from "@shared/types/service"
import { useLanceDB } from "./db"
import { RAGEmbeddingConfig, RAGLocalFileMeta, RAGSearchParam, RAGSearchResult } from "@shared/types/rag"
import { merge, Response, responseCode, StatusResponse } from "@toolmain/shared"
import { ipcMain } from "electron"
import { useFile } from "./doc"

export const RAGServiceId = "RAGService"
export const useRAG = (globalBus: EventBus): RAGService & ServiceCore => {
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
  const file = useFile(globalBus)

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
    file.readFile(emConfig, meta)
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
