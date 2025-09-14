import { ServiceCore } from "@main/types"
import { EventKey } from "@shared/types/eventbus"
import { EventBus, IpcChannel, RAGService } from "@shared/types/service"
import { useLanceDB } from "./db"

export const useRAG = (globalBus: EventBus): RAGService & ServiceCore => {
  const db = useLanceDB()
  function registerIpc() {}
  function dispose() {
    db.close()
  }
  return {
    registerIpc,
    dispose,
  }
}
