import { ServiceCore } from "@main/types"
import useMcp from "./useMCP"
import { BrowserWindow } from "electron"
import useEnv from "./useEnv"
import useFile from "./useFile"
export function registerService(_mainWindow: BrowserWindow): ServiceCore {
  const mcp: ServiceCore = useMcp()
  const env: ServiceCore = useEnv()
  const file: ServiceCore = useFile()

  function dispose() {
    mcp.dispose()
    env.dispose()
    file.dispose()
  }
  function registerIpc(): void {
    mcp.registerIpc()
    env.registerIpc()
    file.registerIpc()
  }
  return {
    dispose,
    registerIpc,
  }
}
