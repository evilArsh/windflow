import { StoreCore } from "@main/packages/useStore/types"
import { ServiceCore } from "@main/types"
import { IpcChannel } from "@shared/types/service"
import { BrowserWindow, ipcMain, nativeTheme } from "electron"
export enum Theme {
  light = "light",
  dark = "dark",
  system = "system",
}
export default (mainWindow: BrowserWindow, store: StoreCore): ServiceCore => {
  let theme: Theme | undefined
  const onThemeUpdated = () => {
    mainWindow.setTitleBarOverlay(
      nativeTheme.shouldUseDarkColors
        ? { height: 40, color: "rgba(0,0,0,0)", symbolColor: "#ffffff" }
        : { height: 40, color: "rgba(0,0,0,0)", symbolColor: "#000000" }
    )
  }
  async function setTheme(newTheme: Theme) {
    if (newTheme === theme) return
    theme = newTheme
    nativeTheme.themeSource = theme
    store.set("MainWindowTheme", theme)
  }
  function registerIpc() {
    ipcMain.handle(IpcChannel.ThemeSetTheme, async (_, newTheme: Theme) => setTheme(newTheme))
  }
  function init() {
    nativeTheme.addListener("updated", onThemeUpdated)
    setTheme(store.get("MainWindowTheme", Theme.system) as Theme)
  }
  init()
  function dispose() {}
  return {
    registerIpc,
    dispose,
  }
}
