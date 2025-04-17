import { contextBridge, ipcRenderer } from "electron"
import { IpcChannel } from "@shared/types/service"
import log from "electron-log"

const api: Record<string, unknown> = {}
function setProperty(obj: Record<string, unknown>, property: string): Record<string, unknown> {
  if (!obj[property]) {
    obj[property] = {}
  }
  return obj[property] as Record<string, unknown>
}
for (const key of Object.values(IpcChannel)) {
  const path = key.split(".")
  let root = api
  let prevRoot: Record<string, unknown> | null = null
  let prevProp = ""
  while (true) {
    const prop = path.shift()
    if (prop) {
      prevRoot = root
      root = setProperty(root, prop)
      prevProp = prop
    } else {
      if (prevProp && prevRoot) {
        prevRoot[prevProp] = async (...args: unknown[]) => {
          log.debug("[api invoke]", key, args)
          return ipcRenderer.invoke(key, ...args)
        }
      }
      break
    }
  }
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
