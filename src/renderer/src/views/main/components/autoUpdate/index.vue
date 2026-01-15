<script setup lang="ts">
import { useDialog } from "@toolmain/shared"
import { useIntervalFn } from "@vueuse/core"
import { AutoUpdateAvailable, AutoUpdateDownloadProgress, AutoUpdateStatusEvent, EventKey } from "@windflow/shared"
import { DialogPanel } from "@toolmain/components"
const { t } = useI18n()

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
const { props, event, close, open } = useDialog({
  width: "40vw",
  showClose: false,
})
const downloaded = computed(() => progress.value.percent == 100)
const downloading = computed(() => progress.value.percent > 0 && progress.value.percent < 100)
const available = ref(false)

const ev = {
  onCheckUpdate() {
    if (!window.api.autoUpdate.checkUpdate) return
    window.api.autoUpdate.checkUpdate()
  },
  onOpenDetail() {
    open()
  },
  onUpdateEvent(data: AutoUpdateStatusEvent) {
    // console.log("[updateEvent]", data)
    switch (data.type) {
      case "UpdateAvailable":
        Object.assign(info.value, data)
        available.value = true
        break
      case "UpdateNotAvailable": {
        available.value = false
        break
      }
      case "UpdateDownloaded": {
        progress.value.percent = 100
        pause()
        break
      }
      case "DownloadProgress": {
        Object.assign(progress.value, data)
        break
      }
    }
  },
  onInstall() {
    window.api?.autoUpdate.quitAndInstall()
  },
}
const { pause } = useIntervalFn(ev.onCheckUpdate, 1000 * 60 * 60)
onMounted(() => {
  if (!window.api) return
  window.api.bus.on(EventKey.AutoUpdateStatus, ev.onUpdateEvent)
  ev.onCheckUpdate()
})
onBeforeUnmount(() => {
  if (!window.api) return
  window.api.bus.off(EventKey.AutoUpdateStatus, ev.onUpdateEvent)
})
</script>
<template>
  <div class="auto-update">
    <el-dialog v-bind="props" v-on="event" style="--el-dialog-padding-primary: 0">
      <DialogPanel class="h-50vh w-full">
        <template #header>
          <el-text>
            {{ t("autoUpdate.releaseTitle") }}
          </el-text>
        </template>
        <div class="overflow-hidden w-full h-full flex flex-col gap-1rem">
          <ContentBox v-if="downloading" class="w-full">
            <el-progress
              class="w-full"
              :percentage="progress.percent"
              :stroke-width="5"
              :status="progress.percent == 100 ? 'success' : 'warning'"
              striped
              :show-text="false"
              striped-flow
              :duration="10" />
            <!-- <template #footer>
              <el-text type="info" size="small">{{ t("btn.cancel") }}</el-text>
            </template> -->
          </ContentBox>
          <div class="flex-1 overflow-auto" v-html="info.releaseNotes"></div>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <el-button type="info" plain @click="close">{{ t("btn.close") }}</el-button>
            <el-button :disabled="!downloaded" type="warning" @click="ev.onInstall">
              {{ t("btn.quitAndInstall") }}
            </el-button>
          </div>
        </template>
      </DialogPanel>
    </el-dialog>
    <ContentBox v-if="available" round>
      <el-badge is-dot :offset="[-5, 5]" :hidden="!downloaded" color="var(--el-color-success)">
        <el-button @click="ev.onOpenDetail" round size="small" plain type="warning">
          <div class="flex flex-col">
            <div class="flex-y-center">
              <i-material-symbols-cloud-download-outline
                class="text-1.6rem"></i-material-symbols-cloud-download-outline>
              <div class="flex gap-[var(--ai-gap-base)] px-[var(--ai-gap-base)]">
                <span>{{ t("autoUpdate.newVersionAvailable") }}</span>
                <span>v{{ info.version }}</span>
              </div>
            </div>
          </div>
        </el-button>
      </el-badge>
    </ContentBox>
  </div>
</template>
<style lang="scss" scoped>
.auto-update {
  -webkit-app-region: no-drag;
}
</style>
