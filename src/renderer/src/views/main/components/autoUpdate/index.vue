<script setup lang="ts">
import { useDialog } from "@toolmain/shared"
import { useIntervalFn } from "@vueuse/core"
import { DialogPanel } from "@toolmain/components"
import { EventKey } from "@windflow/shared"
import { useUpdate } from "./update"
import { filesize } from "filesize"
import logo from "@resources/icon.png"
const { t } = useI18n()

const {
  info,
  appName,
  progress,
  downloaded,
  downloading,
  available,
  currentVersion,
  isAutoDownload,
  isChecking,
  checkErrorMsg,
  downloadTerminable,
  ...ev
} = useUpdate()
const { props, event, close, open } = useDialog({
  width: "50vw",
  showClose: false,
})
function onOpenDetail() {
  ev.getCurrentVersion()
  open()
}
useIntervalFn(ev.onCheckUpdate, 1000 * 60 * 60)
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
      <DialogPanel class="h-70vh w-full">
        <template #header>
          <el-text>
            {{ t("autoUpdate.releaseTitle") }}
          </el-text>
        </template>
        <div class="overflow-hidden w-full h-full flex flex-col gap[var(--ai-gap-medium)]">
          <div class="flex gap[var(--ai-gap-medium)]">
            <el-image :src="logo" class="w-10rem h-10rem flex-shrink-0"></el-image>
            <div class="flex flex-col gap[var(--ai-gap-medium)] flex-1">
              <el-text size="large" class="self-start!" type="primary"> {{ appName }} {{ currentVersion }} </el-text>
              <el-alert v-if="available" :closable="false" type="primary">
                <span> ✨ {{ t("autoUpdate.newVersionAvailable") }} {{ info.version }} </span>
              </el-alert>
              <ContentBox v-if="downloading" class="w-full">
                <el-progress
                  class="w-full"
                  :percentage="progress.percent"
                  :stroke-width="5"
                  :status="progress.percent == 100 ? 'success' : ''"
                  striped
                  :show-text="false"
                  striped-flow
                  :duration="10" />
              </ContentBox>
              <div class="flex justify-between gap[var(--ai-gap-base)]">
                <div>
                  <el-button
                    :loading="isChecking"
                    :disabled="isChecking || downloading"
                    type="success"
                    size="small"
                    @click="ev.onCheckUpdate">
                    {{ t("autoUpdate.checkUpdate") }}
                  </el-button>
                  <Button
                    v-if="available && !downloading && !downloaded && !isChecking"
                    type="warning"
                    size="small"
                    @click="ev.onManualDownload">
                    {{ t("autoUpdate.manualDownload") }}
                  </Button>
                  <el-button v-if="downloadTerminable" type="danger" size="small" @click="ev.onCancelDownload">
                    {{ t("autoUpdate.cancelDownload") }}
                  </el-button>
                </div>
                <div>
                  <el-text v-show="progress.bytesPerSecond" size="small" type="info">
                    {{ filesize(progress.bytesPerSecond) }}/s
                  </el-text>
                </div>
              </div>
            </div>
          </div>
          <el-alert v-if="checkErrorMsg" closable type="error" :title="t('autoUpdate.error')" show-icon>
            <el-text>{{ checkErrorMsg }}</el-text>
          </el-alert>
          <el-switch
            size="small"
            v-model="isAutoDownload"
            :before-change="ev.onBeforeAutoUpdateChange"
            :active-text="t('autoUpdate.auto')"></el-switch>
          <el-divider content-position="left">{{ t("autoUpdate.log") }}</el-divider>
          <div class="flex-1 overflow-auto" v-html="info.releaseNotes"></div>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <el-button type="info" plain text @click="close">{{ t("btn.close") }}</el-button>
            <Button v-if="available" :disabled="!downloaded" type="warning" @click="ev.onInstall">
              {{ t("btn.quitAndInstall") }}
            </Button>
          </div>
        </template>
      </DialogPanel>
    </el-dialog>
    <ContentBox v-if="available" round>
      <el-badge is-dot :offset="[-5, 5]" :hidden="!downloaded" color="var(--el-color-success)">
        <el-button @click="onOpenDetail" round size="small" plain type="warning">
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
    <ContentBox v-else @click="onOpenDetail">
      <i-ic-outline-update class="text-1.6rem c-[var(--el-text-color-regular)]"></i-ic-outline-update>
    </ContentBox>
  </div>
</template>
<style lang="scss" scoped>
.auto-update {
  -webkit-app-region: no-drag;
}
</style>
