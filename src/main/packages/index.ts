import { ServiceCore } from "@main/types"
import useMcp from "./useMCP"
import { BrowserWindow } from "electron"
import useEnv from "./useEnv"
import useFile from "./useFile"
import usePreset from "./usePreset"
import useEventBus from "./useEventBus"
export function registerService(mainWindow: BrowserWindow): ServiceCore {
  const bus = useEventBus(mainWindow)
  const preset = usePreset(mainWindow)
  const mcp: ServiceCore = useMcp(bus)
  const env: ServiceCore = useEnv()
  const file: ServiceCore = useFile()

  function dispose() {
    mcp.dispose()
    env.dispose()
    file.dispose()
    preset.dispose()
    bus.dispose()
  }
  function registerIpc(): void {
    bus.registerIpc()
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
