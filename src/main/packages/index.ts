import { ServiceCore } from "@main/types"
import useMcp from "./useMCP"
import { BrowserWindow } from "electron"
export function registerService(_mainWindow: BrowserWindow): ServiceCore {
  const mcp: ServiceCore = useMcp()

  function dispose() {
    mcp.dispose()
  }
  function registerIpc(): void {
    mcp.registerIpc()
  }
  return {
    dispose,
    registerIpc,
  }
}
