import type { ElectronAPI } from "@electron-toolkit/preload"
import type { MCPService, FileService, EventBus, ThemeService, RAGService } from "@windflow/shared"
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      mcp: MCPService
      file: FileService
      bus: EventBus
      theme: ThemeService
      rag: RAGService
    }
  }
}
