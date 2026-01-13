import { Tray, BrowserWindow, nativeImage, Menu, app } from "electron"
import path from "path"

export function createTray(mainWindow: BrowserWindow) {
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, "../../resources", "icon.png")).resize({
    width: 32,
    height: 32,
  })
  const tray = new Tray(trayIcon)
  function showWindow(mainWindow: BrowserWindow) {
    mainWindow.show()
    mainWindow.focus()
    app.dock?.show()
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
  }
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Quit",
      click: () => {
        const windows = BrowserWindow.getAllWindows()
        windows.forEach(window => {
          window.destroy()
        })
      },
    },
  ])
  tray.setContextMenu(contextMenu)
  tray.on("click", () => {
    showWindow(mainWindow)
  })
  tray.on("right-click", () => {
    tray?.popUpContextMenu?.()
  })
  tray.setToolTip("windflow")
  return tray
}
