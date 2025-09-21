import { ServiceCore } from "@main/types"
import { BrowserWindow } from "electron"

import { MCPServiceImpl } from "./Mcp"
import { FileServiceImpl } from "./File"
import { EventBusImpl } from "./EventBus"
import { ThemeServiceImpl } from "./Theme"
import { RAGServiceImpl } from "./Rag"

export function registerService(mainWindow: BrowserWindow): ServiceCore {
  const bus = new EventBusImpl(mainWindow)
  const mcp = new MCPServiceImpl(bus)
  const file = new FileServiceImpl()
  const theme = new ThemeServiceImpl(mainWindow)
  const rag = new RAGServiceImpl(bus)

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
