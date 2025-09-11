import { ServiceCore } from "@main/types"
import { EventKey } from "@shared/types/eventbus"
import { EventBus, IpcChannel, RAGService } from "@shared/types/service"

export const useRAG = (globalBus: EventBus): RAGService & ServiceCore => {
  function registerIpc() {}
  function dispose() {}
  return {
    registerIpc,
    dispose,
  }
}
