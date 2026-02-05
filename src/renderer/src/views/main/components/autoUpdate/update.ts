import useSettingsStore from "@renderer/store/settings"
import { msgError } from "@renderer/utils"
import { CallBackFn, errorToText } from "@toolmain/shared"
import { SettingKeys } from "@windflow/core/types"
import { AutoUpdateAvailable, AutoUpdateDownloadProgress, AutoUpdateStatusEvent } from "@windflow/shared"

async function setAutoUpdate(auto?: boolean) {
  return window.api?.autoUpdate.setAutoDownload(!!auto)
}
export function useUpdate() {
  const settingsStore = useSettingsStore()
  const currentVersion = ref("")

  const { data: isAutoDownload } = settingsStore.dataWatcher(SettingKeys.AutoUpdate, null, true)
  const isChecking = ref(false)
  const downloadTerminable = ref(false)

  const checkErrorMsg = ref("")
  const available = ref(false) // update available

  const info = ref<AutoUpdateAvailable>({
    type: "UpdateNotAvailable",
    version: "",
    releaseDate: "",
    releaseName: "",
    releaseNotes: "",
  })
  const progress = ref<AutoUpdateDownloadProgress>({
    type: "DownloadProgress",
    total: 0,
    delta: 0,
    transferred: 0,
    percent: 0,
    bytesPerSecond: 0,
  })
  const downloaded = computed(() => progress.value.percent == 100)
  const downloading = computed(() => progress.value.percent > 0 && progress.value.percent < 100)

  function _resetProgress() {
    progress.value.percent = 0
  }
  async function _getDownloadTerminable() {
    downloadTerminable.value = await window.api?.autoUpdate.downloadTerminable()
  }
  async function getCurrentVersion() {
    const v = await window.api?.autoUpdate.getCurrentVersion()
    currentVersion.value = v ? `v${v}` : ""
  }
  async function onCheckUpdate() {
    isChecking.value = true
    await setAutoUpdate(isAutoDownload.value)
    await window.api?.autoUpdate.checkUpdate()
  }
  function onUpdateEvent(data: AutoUpdateStatusEvent) {
    // console.log("[updateEvent]", data)
    switch (data.type) {
      case "UpdateAvailable":
        Object.assign(info.value, data)
        available.value = true
        isChecking.value = false
        checkErrorMsg.value = ""
        _getDownloadTerminable()
        break
      case "UpdateNotAvailable": {
        available.value = false
        Object.assign(info.value, data)
        isChecking.value = false
        checkErrorMsg.value = ""
        break
      }
      case "UpdateDownloaded": {
        progress.value.percent = 100
        break
      }
      case "DownloadProgress": {
        Object.assign(progress.value, data)
        break
      }
      case "UpdateChecking": {
        isChecking.value = true
        checkErrorMsg.value = ""
        break
      }
      case "UpdateError": {
        checkErrorMsg.value = data.msg ?? ""
        isChecking.value = false
        available.value = false
        _resetProgress()
      }
    }
  }
  async function onInstall(done: CallBackFn) {
    await window.api?.autoUpdate.quitAndInstall()
    done()
  }
  async function onBeforeAutoUpdateChange(): Promise<boolean> {
    try {
      await setAutoUpdate(isAutoDownload.value)
      _getDownloadTerminable()
      return true
    } catch (error) {
      msgError(errorToText(error))
      return false
    }
  }
  async function onManualDownload(done: CallBackFn) {
    try {
      await window.api?.autoUpdate.manualDownload()
      done()
    } catch (error) {
      checkErrorMsg.value = errorToText(error)
      isChecking.value = false
      available.value = false
      _resetProgress()
      done()
    }
  }
  function onCancelDownload() {
    window.api?.autoUpdate.cancelDownload()
  }
  onMounted(() => {
    _getDownloadTerminable()
    getCurrentVersion()
  })
  return {
    info,
    progress,
    currentVersion,
    downloaded,
    downloading,
    available,
    isAutoDownload,
    isChecking,
    checkErrorMsg,
    downloadTerminable,
    getCurrentVersion,
    onManualDownload,
    onCancelDownload,
    onBeforeAutoUpdateChange,
    onCheckUpdate,
    onUpdateEvent,
    onInstall,
  }
}
