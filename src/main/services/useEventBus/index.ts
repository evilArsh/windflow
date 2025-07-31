import { ServiceCore } from "@main/types"
import { CoreEvent, CoreEventKey, EventKey, EventMap } from "@shared/types/eventbus"
import { EventBus } from "@shared/types/service"
import { BrowserWindow, ipcMain, IpcMainEvent } from "electron"
import EventEmitter from "node:events"
export default (mainWindow: BrowserWindow): ServiceCore & EventBus => {
  const bus = new EventEmitter()
  const listener = (_: IpcMainEvent, data: CoreEvent) => {
    bus.emit(data.type, data.data)
  }
  function on<T extends EventKey>(event: T, callback: (data: EventMap[T]) => void) {
    bus.on(event, callback)
  }
  function off<T extends EventKey>(event: T, callback: (data: EventMap[T]) => void) {
    bus.off(event, callback)
  }
  function emit<T extends EventKey>(event: T, data: EventMap[T]) {
    mainWindow.webContents.send(CoreEventKey, {
      type: event,
      data,
    } as CoreEvent)
  }

  function registerIpc() {
    ipcMain.on(CoreEventKey, listener)
  }
  function dispose() {
    ipcMain.off(CoreEventKey, listener)
    bus.removeAllListeners()
  }
  return {
    on,
    off,
    emit,
    registerIpc,
    dispose,
  }
}
