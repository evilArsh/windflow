import { isHTTPUrl } from "@toolmain/shared"
import { BrowserWindow, globalShortcut, app } from "electron"

function openExternalWindow(mainWindow: BrowserWindow, url: string) {
  const parentBounds = mainWindow.getBounds()
  const parentWidth = parentBounds.width
  const parentHeight = parentBounds.height
  const childWidth = Math.floor(parentWidth * 0.8)
  const childHeight = Math.floor(parentHeight * 0.8)
  const childX = parentBounds.x + (parentWidth - childWidth) / 2
  const childY = parentBounds.y + (parentHeight - childHeight) / 2
  const externalWindow = new BrowserWindow({
    x: childX,
    y: childY,
    width: childWidth,
    height: childHeight,
    parent: mainWindow,
    modal: true,
    autoHideMenuBar: true,
  })
  externalWindow.loadURL(url)
}

export function presetWindowContent(mainWindow: BrowserWindow) {
  // 拦截所有导航（包括 window.location 跳转）
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const contentUrl = mainWindow.webContents.getURL()
    // console.log("[will navigate url]", url)
    // console.log("[will navigate]", contentUrl)
    if (url !== contentUrl) {
      event.preventDefault()
      openExternalWindow(mainWindow, url)
    }
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // console.log("[setWindowOpenHandler]", url)
    if (isHTTPUrl(url)) {
      openExternalWindow(mainWindow, url)
      return { action: "deny" }
    }
    return { action: "allow" }
  })

  mainWindow.on("close", e => {
    e.preventDefault()
    mainWindow.hide()
    app.dock?.hide()
  })
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isFocused()) {
      mainWindow.webContents.toggleDevTools()
    }
  })
}
