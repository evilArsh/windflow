<script lang="ts" setup>
import useRagFilesStore from "@renderer/store/ragFiles"
import { RAGFileStatus, RAGLocalFileInfo } from "@shared/types/rag"
import { CallBackFn, msgError, errorToText } from "@toolmain/shared"
import { filesize } from "filesize"
import { Spinner } from "@toolmain/components"

defineProps<{
  fileList: RAGLocalFileInfo[]
}>()

const ragFilesStore = useRagFilesStore()

const { t } = useI18n()

const ev = {
  async onDelete(item: RAGLocalFileInfo, done: CallBackFn) {
    try {
      await ragFilesStore.remove(item.id)
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      done()
    }
  },
  async onOpenPath(path: string) {
    try {
      if (window.api) {
        await window.api.file.open(path)
      }
    } catch (error) {
      msgError(errorToText(error))
    }
  },
}
</script>
<template>
  <el-scrollbar>
    <ContentBox
      v-for="item in fileList"
      class="select-unset! mb-1rem!"
      style="--box-bg-color: var(--el-bg-color); --content-box-padding: var(--ai-gap-base)"
      :key="item.id">
      <i class="i-ic:baseline-insert-drive-file text-3rem"></i>
      <ContentBox class="flex-1 select-unset!" normal>
        <el-space>
          <el-text type="primary">{{ item.fileName }}</el-text>
          <Spinner destroy-icon :model-value="item.status === RAGFileStatus.Processing" class="text-1.4rem"></Spinner>
          <i
            v-if="item.status === RAGFileStatus.Success"
            class="i-ep-success-filled text-2rem c-[var(--el-color-primary)]"></i>
          <i
            v-if="item.status === RAGFileStatus.Failed"
            class="i-ep-circle-close-filled text-2rem c-[var(--el-color-danger)]"></i>
        </el-space>
        <template #end> </template>
        <template #footer>
          <div class="flex">
            <el-text size="small" type="info">{{ filesize(item.fileSize) }}</el-text>
            <el-divider direction="vertical"></el-divider>
            <el-link
              @click="ev.onOpenPath(item.path)"
              style="--el-link-font-size: var(--el-font-size-extra-small)"
              underline="always"
              type="info">
              {{ item.path }}
            </el-link>
          </div>
        </template>
      </ContentBox>
      <template #footer>
        <PopConfirm
          :title="t('tip.deleteConfirm')"
          :confirm-button-text="t('tip.yes')"
          confirm-button-type="danger"
          :cancel-button-text="t('btn.cancel')"
          cancel-button-type="text"
          size="small"
          :confirm="done => ev.onDelete(item, done)">
          <template #reference="{ loading, disabled }">
            <el-button :loading :disabled size="small" type="danger" round text>
              <i class="i-ep-delete-filled text-1.4rem"></i>
            </el-button>
          </template>
        </PopConfirm>
        <el-divider direction="vertical"></el-divider>
        <el-text v-if="item.status === RAGFileStatus.Failed" size="small" type="danger" class="break-all!">
          {{ item.msg }}
        </el-text>
      </template>
    </ContentBox>
  </el-scrollbar>
</template>
<style lang="scss" scoped></style>
