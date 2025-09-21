import { ServiceCore } from "@main/types"
import { CoreEvent, CoreEventKey, EventKey, EventMap } from "@shared/types/eventbus"
import { EventBus } from "@shared/types/service"
import { BrowserWindow, ipcMain, IpcMainEvent } from "electron"
import EventEmitter from "node:events"
export class EventBusImpl implements ServiceCore, EventBus {
  #mainWindow: BrowserWindow
  #bus = new EventEmitter()
  #listener = (_: IpcMainEvent, data: CoreEvent) => {
    this.#bus.emit(data.type, data.data)
  }
  constructor(mainWindow: BrowserWindow) {
    this.#mainWindow = mainWindow
  }
  on<T extends EventKey>(event: T, callback: (data: EventMap[T]) => void) {
    this.#bus.on(event, callback)
  }
  off<T extends EventKey>(event: T, callback: (data: EventMap[T]) => void) {
    this.#bus.off(event, callback)
  }
  emit<T extends EventKey>(event: T, data: EventMap[T]) {
    this.#mainWindow.webContents.send(CoreEventKey, {
      type: event,
      data,
    } as CoreEvent)
  }
  registerIpc() {
    ipcMain.on(CoreEventKey, this.#listener.bind(this))
  }
  dispose() {
    ipcMain.off(CoreEventKey, this.#listener.bind(this))
    this.#bus.removeAllListeners()
  }
}
