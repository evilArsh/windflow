import { ServiceCore } from "@main/types"
import { AutoUpdateAvailable, AutoUpdateService, EventBus, EventKey, IpcChannel } from "@windflow/shared"
import { autoUpdater, CancellationToken, UpdateCheckResult, UpdateInfo } from "electron-updater"
import { ipcMain, app } from "electron"
import { log } from "./vars"
import { errorToText } from "@toolmain/shared"

export class AutoUpdateServiceImpl implements AutoUpdateService, ServiceCore {
  #updateCheckResult: UpdateCheckResult | null
  #globalBus: EventBus
  #checking: boolean
  #downloadToken: CancellationToken | null
  constructor(globalBus: EventBus) {
    this.#downloadToken = null
    this.#checking = false
    this.#updateCheckResult = null
    this.#globalBus = globalBus
    autoUpdater.logger = log
    autoUpdater.autoDownload = true
    autoUpdater.forceDevUpdateConfig = !app.isPackaged
    autoUpdater.disableWebInstaller = true
    autoUpdater.autoRunAppAfterInstall = true
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
      this.#globalBus.emit(EventKey.AutoUpdateStatus, {
        type: "UpdateChecking",
      })
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
      this.#downloadToken?.dispose()
      this.#downloadToken = null
      this.#emitStatus("UpdateDownloaded", info)
    })
    autoUpdater.on("error", error => {
      this.#checking = false
      this.#globalBus.emit(EventKey.AutoUpdateStatus, {
        type: "UpdateError",
        msg: errorToText(error),
      })
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
  async quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean) {
    return autoUpdater.quitAndInstall(isSilent, isForceRunAfter)
  }
  async setAutoDownload(autoDownload: boolean) {
    autoUpdater.autoDownload = autoDownload
  }
  async getAutoDownload() {
    return autoUpdater.autoDownload
  }
  async manualDownload(): Promise<string[]> {
    this.#downloadToken?.cancel()
    this.#downloadToken = new CancellationToken()
    return autoUpdater.downloadUpdate(this.#downloadToken)
  }
  async cancelDownload(): Promise<boolean> {
    if (this.#downloadToken) {
      this.#downloadToken.cancel()
      this.#downloadToken.dispose()
      this.#downloadToken = null
      return true
    }
    return false
  }
  async getCurrentVersion(): Promise<string> {
    return app.getVersion()
  }
  async downloadTerminable(): Promise<boolean> {
    return this.#downloadToken !== null && !this.#downloadToken.cancelled
  }
  registerIpc() {
    ipcMain.handle(IpcChannel.AutoUpdateCheckUpdate, async (_, feedUrl?: string) => {
      return this.checkUpdate(feedUrl)
    })
    ipcMain.handle(IpcChannel.AutoUpdateQuitAndInstall, async (_, isSilent?: boolean, isForceRunAfter?: boolean) => {
      return this.quitAndInstall(isSilent, isForceRunAfter)
    })
    ipcMain.handle(IpcChannel.AutoUpdateGetCurrentVersion, async () => this.getCurrentVersion())
    ipcMain.handle(IpcChannel.AutoUpdateSetAutoDownload, async (_, a: boolean) => this.setAutoDownload(a))
    ipcMain.handle(IpcChannel.AutoUpdateGetAutoDownload, async _ => this.getAutoDownload())
    ipcMain.handle(IpcChannel.AutoUpdateManualDownload, async _ => this.manualDownload())
    ipcMain.handle(IpcChannel.AutoUpdateCancelDownload, async _ => this.cancelDownload())
    ipcMain.handle(IpcChannel.AutoUpdateDownloadTerminable, async _ => this.downloadTerminable())
  }
  dispose() {
    this.#updateCheckResult?.cancellationToken?.cancel()
  }
}
