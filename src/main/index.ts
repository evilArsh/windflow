import { app, shell, BrowserWindow } from "electron"
import { join } from "path"
import { electronApp, optimizer, is, platform } from "@electron-toolkit/utils"
import icon from "../../resources/icon.png?asset"

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    minWidth: 1024,
    minHeight: 768,
    autoHideMenuBar: true,
    ...(platform.isLinux ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      webSecurity: false,
      webviewTag: true,
    },
  })

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
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.arsh.aichat")
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  createWindow()
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
