import { contextBridge, ipcRenderer } from "electron"
import { EventBus, IpcChannel } from "@shared/service"
import { CoreEvent, CoreEventKey, EventKey, EventMap } from "@shared/types/eventbus"
import EventEmitter from "node:events"
import { useLog } from "@main/hooks/useLog"

const api: Record<string, unknown> = {}
const log = useLog("Preload")

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
  // 迭代添加Record键值对
  while (true) {
    const prop = path.shift()
    if (prop) {
      prevRoot = root
      root = setProperty(root, prop)
      prevProp = prop
    } else {
      if (prevProp && prevRoot) {
        prevRoot[prevProp] = async (...args: unknown[]) => {
          return ipcRenderer.invoke(key, ...args)
        }
      }
      break
    }
  }
}
const useEventBus = (): EventBus => {
  const bus = new EventEmitter()
  // 接收主进程的消息
  ipcRenderer.on(CoreEventKey, (_, data: CoreEvent) => {
    log.debug("[event from ipcMain]", data)
    bus.emit(data.type, data.data)
  })
  const on = <T extends EventKey>(event: T, callback: (data: EventMap[T]) => void) => {
    bus.on(event, callback)
  }
  const off = <T extends EventKey>(event: T, callback: (data: EventMap[T]) => void) => {
    bus.off(event, callback)
  }
  const emit = <T extends EventKey>(event: T, data: EventMap[T]) => {
    ipcRenderer.send(CoreEventKey, { event, data })
  }
  return {
    on,
    off,
    emit,
  }
}
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", { ...api, bus: useEventBus() })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.api = api
}
