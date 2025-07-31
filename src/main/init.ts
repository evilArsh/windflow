import { ServiceCore } from "@main/types"
import { BrowserWindow } from "electron"
import usePreset from "./packages/usePreset"

import useMcp from "./services/useMCP"
import useEnv from "./services/useEnv"
import useFile from "./services/useFile"
import useEventBus from "./services/useEventBus"
import useTheme from "./services/useTheme"
import useStore from "./packages/useStore"
export function registerService(mainWindow: BrowserWindow): ServiceCore {
  const preset = usePreset(mainWindow)
  const store = useStore()

  const bus = useEventBus(mainWindow)
  const mcp = useMcp(bus)
  const env = useEnv()
  const file = useFile()
  const theme = useTheme(mainWindow, store)

  function dispose() {
    theme.dispose()
    bus.dispose()
    mcp.dispose()
    env.dispose()
    file.dispose()
    preset.dispose()

    preset.dispose()
    store.dispose()
  }
  function registerIpc(): void {
    theme.registerIpc()
    bus.registerIpc()
    mcp.registerIpc()
    env.registerIpc()
    file.registerIpc()
  }
  return {
    dispose,
    registerIpc,
  }
}
