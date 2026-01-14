import { ServiceCore } from "@main/types"
import { AutoUpdateAvailable, AutoUpdateService, EventBus, EventKey, IpcChannel } from "@windflow/shared"
import { autoUpdater, UpdateCheckResult, UpdateInfo } from "electron-updater"
import { ipcMain, app } from "electron"
import { log } from "./vars"
import { errorToText } from "@toolmain/shared"

export class AutoUpdateServiceImpl implements AutoUpdateService, ServiceCore {
  #updateCheckResult: UpdateCheckResult | null
  #globalBus: EventBus
  #checking: boolean
  constructor(globalBus: EventBus) {
    this.#checking = false
    this.#updateCheckResult = null
    this.#globalBus = globalBus
    autoUpdater.logger = log
    autoUpdater.autoDownload = true
    autoUpdater.forceDevUpdateConfig = !app.isPackaged
    autoUpdater.disableWebInstaller = true
    this.#init()
  }
  #emitStatus(type: AutoUpdateAvailable["type"], info: UpdateInfo) {
    this.#globalBus.emit(EventKey.AutoUpdateStatus, {
      type,
      releaseDate: info.releaseDate,
      version: info.version,
      releaseName: info.releaseName,
      releaseNotes: info.releaseNotes,
    })
  }
  #init() {
    autoUpdater.on("checking-for-update", () => {
      this.#checking = true
    })
    autoUpdater.on("update-available", info => {
      this.#checking = false
      this.#emitStatus("UpdateAvailable", info)
    })
    autoUpdater.on("update-not-available", info => {
      this.#checking = false
      this.#emitStatus("UpdateNotAvailable", info)
    })
    autoUpdater.on("download-progress", info => {
      this.#globalBus.emit(EventKey.AutoUpdateStatus, {
        type: "DownloadProgress",
        total: info.total,
        delta: info.delta,
        transferred: info.transferred,
        percent: info.percent,
        bytesPerSecond: info.bytesPerSecond,
      })
    })
    autoUpdater.on("update-downloaded", info => {
      this.#emitStatus("UpdateDownloaded", info)
    })
    autoUpdater.on("error", _ => {
      this.#checking = false
    })
  }
  async checkUpdate(feedUrl?: string) {
    try {
      if (this.#checking) return
      if (feedUrl) {
        autoUpdater.setFeedURL(feedUrl)
      }
      this.#checking = true
      const res = await autoUpdater.checkForUpdates()
      this.#updateCheckResult = res
    } catch (error) {
      this.#checking = false
      log.error("[checkUpdate]", errorToText(error))
    }
  }
  quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean) {
    autoUpdater.quitAndInstall(isSilent, isForceRunAfter)
  }
  registerIpc() {
    ipcMain.handle(IpcChannel.AutoUpdateCheckUpdate, (_, feedUrl?: string) => {
      return this.checkUpdate(feedUrl)
    })
    ipcMain.handle(IpcChannel.AutoUpdateQuitAndInstall, (_, isSilent?: boolean, isForceRunAfter?: boolean) => {
      return this.quitAndInstall(isSilent, isForceRunAfter)
    })
  }
  dispose() {
    this.#updateCheckResult?.cancellationToken?.cancel()
  }
}
