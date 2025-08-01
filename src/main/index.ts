import { app, shell, BrowserWindow } from "electron"
import { join } from "path"
import { electronApp, optimizer, is, platform } from "@electron-toolkit/utils"
import windowStateKeeper from "electron-window-state"
import icon from "../../resources/icon.png?asset"
import { registerService } from "./init"
import { ServiceCore } from "./types"
import { autoBackgroundColor, autoTitleBarOverlay } from "./services/useTheme"
function createWindow(): BrowserWindow {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1366,
    defaultHeight: 768,
  })

  const mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: "hidden",
    show: false,
    autoHideMenuBar: true,
    transparent: false,
    titleBarOverlay: autoTitleBarOverlay(),
    backgroundColor: autoBackgroundColor(),
    movable: true,
    ...(platform.isLinux ? { icon } : {}),
    webPreferences: {
      devTools: true,
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      webSecurity: false,
      contextIsolation: true,
      webviewTag: true,
    },
  })
  mainWindowState.manage(mainWindow)
  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })
  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
  }
  return mainWindow
}

function init() {
  let serviceCore: ServiceCore | undefined
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
  } else {
    app.whenReady().then(() => {
      electronApp.setAppUserModelId("com.arch.aichat")
      // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
      app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window)
      })
      app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
      })
      const mainWindow = createWindow()
      serviceCore = registerService(mainWindow)
      serviceCore.registerIpc()
    })
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit()
      }
    })
    app.on("before-quit", () => {
      serviceCore?.dispose()
    })
  }
}
init()
