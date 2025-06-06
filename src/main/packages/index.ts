import { ServiceCore } from "@main/types"
import useMcp from "./useMCP"
import { BrowserWindow } from "electron"
import useEnv from "./useEnv"
import useFile from "./useFile"
import usePreset from "./usePreset"
export function registerService(mainWindow: BrowserWindow): ServiceCore {
  const preset = usePreset(mainWindow)
  const mcp: ServiceCore = useMcp()
  const env: ServiceCore = useEnv()
  const file: ServiceCore = useFile()

  function dispose() {
    mcp.dispose()
    env.dispose()
    file.dispose()
    preset.dispose()
  }
  function registerIpc(): void {
    mcp.registerIpc()
    env.registerIpc()
    file.registerIpc()
    preset.registerIpc()
  }
  return {
    dispose,
    registerIpc,
  }
}
