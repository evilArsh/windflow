import { ServiceCore } from "@main/types"
import { BrowserWindow } from "electron"

import { useMCP } from "./Mcp"
import { useFile } from "./File"
import { useEventBus } from "./EventBus"
import { useTheme } from "./Theme"
import { useRAG } from "./Rag"

export function registerService(mainWindow: BrowserWindow): ServiceCore {
  const bus = useEventBus(mainWindow)
  const mcp = useMCP(bus)
  const file = useFile()
  const theme = useTheme(mainWindow)
  const rag = useRAG(bus)

  function dispose() {
    theme.dispose()
    bus.dispose()
    mcp.dispose()
    file.dispose()
    rag.dispose()
  }
  function registerIpc(): void {
    theme.registerIpc()
    bus.registerIpc()
    mcp.registerIpc()
    file.registerIpc()
    rag.registerIpc()
  }
  return {
    dispose,
    registerIpc,
  }
}
