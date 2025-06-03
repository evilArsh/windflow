import { ElectronAPI } from "@electron-toolkit/preload"
import { EnvService, MCPService } from "@shared/types/service"
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      mcp: MCPService
      env: EnvService
    }
  }
}
