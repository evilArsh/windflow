import { ServiceCore } from "@main/types"
import { EventBus, IpcChannel, RAGService } from "@shared/types/service"

export const useRAG = (): RAGService & ServiceCore => {
  function registerIpc() {}
  function dispose() {}
  return {
    registerIpc,
    dispose,
  }
}
