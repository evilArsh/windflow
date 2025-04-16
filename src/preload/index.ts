import { contextBridge, ipcRenderer } from "electron"
import { IpcChannel } from "@shared/types/service"
// types definition is in index.d.ts
const api = {
  mcp: {
    registerClient: (...args: unknown[]) => ipcRenderer.invoke(IpcChannel.mcp_registerClient, ...args),
    toggleServer: (...args: unknown[]) => ipcRenderer.invoke(IpcChannel.mcp_toggleServer, ...args),
    listTools: (...args: unknown[]) => ipcRenderer.invoke(IpcChannel.mcp_listTools, ...args),
    listAllTools: (...args: unknown[]) => ipcRenderer.invoke(IpcChannel.mcp_listAllTools, ...args),
  },
}
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.api = api
}
