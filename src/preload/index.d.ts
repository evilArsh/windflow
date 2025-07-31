import type { ElectronAPI } from "@electron-toolkit/preload"
import type { EnvService, MCPService, FileService, EventBus, ThemeService } from "@shared/types/service"
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      mcp: MCPService
      env: EnvService
      file: FileService
      bus: EventBus
      theme: ThemeService
    }
  }
}
