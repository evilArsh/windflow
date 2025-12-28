import { platform } from "@electron-toolkit/utils"
import { useStore } from "@main/hooks/useStore"
import { ServiceCore } from "@main/types"
import { IpcChannel, ThemeService, Theme } from "@windflow/shared"
import { BrowserWindow, ipcMain, nativeTheme } from "electron"

export const DarkOverlay: Electron.TitleBarOverlayOptions = {
  height: 40,
  color: "rgba(0,0,0,0)",
  symbolColor: "#ffffff",
}
export const LightkOverlay: Electron.TitleBarOverlayOptions = {
  height: 40,
  color: "#ffffff",
  symbolColor: "#1E1E1E",
}
export const DarkBackgroundColor = "#1E1E1E"
export const LightBackgroundColor = "#ffffff"

export const autoTitleBarOverlay = () => {
  return nativeTheme.shouldUseDarkColors ? DarkOverlay : LightkOverlay
}
export const autoBackgroundColor = () => {
  return nativeTheme.shouldUseDarkColors ? DarkBackgroundColor : LightBackgroundColor
}
export class ThemeServiceImpl implements ThemeService, ServiceCore {
  #mainWindow: BrowserWindow
  #theme: Theme | undefined
  #store = useStore()
  #onThemeUpdated = () => {
    if (!platform.isMacOS) {
      this.#mainWindow.setTitleBarOverlay(autoTitleBarOverlay())
    }
    this.#mainWindow.setBackgroundColor(autoBackgroundColor())
  }
  #init() {
    nativeTheme.addListener("updated", this.#onThemeUpdated.bind(this))
    this.setTheme(this.#store.get("MainWindowTheme", Theme.system) as Theme)
  }
  constructor(mainWindow: BrowserWindow) {
    this.#mainWindow = mainWindow
    this.#init()
  }
  async setTheme(newTheme: Theme) {
    if (newTheme === this.#theme) return
    this.#theme = newTheme
    nativeTheme.themeSource = this.#theme
    this.#store.set("MainWindowTheme", this.#theme)
  }
  registerIpc() {
    ipcMain.handle(IpcChannel.ThemeSetTheme, async (_, newTheme: Theme) => this.setTheme(newTheme))
  }

  dispose() {}
}
