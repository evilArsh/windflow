import { ElectronAPI } from "@electron-toolkit/preload"
import { MCPService } from "@shared/types/service"
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      mcp: MCPService
    }
  }
}
