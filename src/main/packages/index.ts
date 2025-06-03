import { ServiceCore } from "@main/types"
import useMcp from "./useMCP"
import { BrowserWindow } from "electron"
import useEnv from "./useEnv"
export function registerService(_mainWindow: BrowserWindow): ServiceCore {
  const mcp: ServiceCore = useMcp()
  const env: ServiceCore = useEnv()

  function dispose() {
    mcp.dispose()
    env.dispose()
  }
  function registerIpc(): void {
    mcp.registerIpc()
    env.registerIpc()
  }
  return {
    dispose,
    registerIpc,
  }
}
