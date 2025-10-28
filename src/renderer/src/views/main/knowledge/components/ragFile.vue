<script lang="ts" setup>
import useRagFilesStore from "@renderer/store/ragFiles"
import useEmbeddingStore from "@renderer/store/embedding"
import useKnowledgeStore from "@renderer/store/knowledge"
import { Knowledge } from "@renderer/types/knowledge"
import { RAGFileStatus, RAGLocalFileInfo } from "@shared/types/rag"
import { DialogPanel } from "@toolmain/components"
import { filesize } from "filesize"
import { CallBackFn, errorToText, msgError } from "@toolmain/shared"
import { Spinner } from "@toolmain/components"
import { storeToRefs } from "pinia"
const emit = defineEmits<{
  (e: "edit", knowledgeId: string, fileList: RAGLocalFileInfo[], done: CallBackFn): void
  (e: "remove", knowledgeId: string, done: CallBackFn): void
}>()
const props = defineProps<{
  knowledge: Knowledge
}>()
const { t } = useI18n()
const embeddingStore = useEmbeddingStore()
const ragFilesStore = useRagFilesStore()
const knowledgeStore = useKnowledgeStore()
const { ragFiles } = storeToRefs(ragFilesStore)
const knowledge = computed(() => props.knowledge)

const fileList = computed<RAGLocalFileInfo[]>(() => {
  return ragFiles.value[props.knowledge.id] ?? []
})
const { embeddings } = storeToRefs(embeddingStore)
const upload = {
  async onChooseFile(done: CallBackFn) {
    try {
      if (window.api) {
        const res = await window.api.file.chooseFilePath()
        if (!res.data.length) return
        await knowledgeStore.processFiles(res.data, props.knowledge)
      }
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      done()
    }
  },
}
const ev = {
  async onDelete(item: RAGLocalFileInfo, done: CallBackFn) {
    try {
      await ragFilesStore.remove(item.id)
      confirm()
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      done()
    }
  },
}
</script>
<template>
  <DialogPanel style="--el-card-border-color: transparent">
    <template #header>
      <div class="flex gap-1rem">
        <Button size="small" type="warning" @click="done => emit('edit', knowledge.id, fileList, done)">
          {{ t("btn.edit") }}
        </Button>
        <PopConfirm
          :title="t('tip.deleteConfirm')"
          :confirm-button-text="t('tip.yes')"
          confirm-button-type="danger"
          :cancel-button-text="t('btn.cancel')"
          cancel-button-type="text"
          size="small"
          @confirm="done => emit('remove', knowledge.id, done)">
          <el-button size="small" type="danger">
            <i class="i-ep-delete-filled text-1.4rem"></i>
          </el-button>
        </PopConfirm>
        <Button size="small" type="primary" @click="upload.onChooseFile">
          <template #icon>
            <el-icon class="text-1.4rem"> <i class="i-ep:upload-filled"></i> </el-icon>
          </template>
          {{ t("btn.upload") }}
        </Button>
      </div>
    </template>
    <div class="flex w-full h-full overflow-hidden flex-col gap-1rem">
      <el-card class="flex-shrink-0" shadow="never" style="--el-card-padding: 1rem">
        <template #header>
          <el-text type="primary">{{ t("knowledge.detail") }}</el-text>
        </template>
        <el-descriptions label-width="auto" :column="2" border>
          <el-descriptions-item width="40%" :label="t('knowledge.name')">{{ knowledge.name }}</el-descriptions-item>
          <el-descriptions-item width="40%" :label="t('knowledge.type')">{{ knowledge.type }}</el-descriptions-item>
          <el-descriptions-item width="40%" :label="t('knowledge.embedding')">
            <el-select disabled v-model="knowledge.embeddingId" placeholder="">
              <el-option v-for="em in embeddings" :key="em.id" :label="em.name" :value="em.id"></el-option>
            </el-select>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      <el-card
        class="flex flex-1 flex-col overflow-hidden"
        shadow="never"
        style="--el-card-padding: 1rem; --el-card-bg-color: var(--el-fill-color-light)">
        <template #header>
          <el-text type="primary">{{ t("knowledge.fileList") }}</el-text>
        </template>
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
                <Spinner
                  destroy-icon
                  :model-value="item.status === RAGFileStatus.Processing"
                  class="text-1.4rem"></Spinner>
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
                  <el-link style="--el-link-font-size: var(--el-font-size-extra-small)" underline="always" type="info">
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
                cancel-button-type="default"
                size="small"
                @confirm="done => ev.onDelete(item, done)">
                <el-button size="small" type="danger" round text>
                  <i class="i-ep-delete-filled text-1.4rem"></i>
                </el-button>
              </PopConfirm>
              <el-divider direction="vertical"></el-divider>
              <el-text v-if="item.status === RAGFileStatus.Failed" size="small" type="danger" class="break-all!">
                {{ item.msg }}
              </el-text>
            </template>
          </ContentBox>
        </el-scrollbar>
      </el-card>
    </div>
  </DialogPanel>
</template>
<style lang="scss" scoped>
.upload {
  :deep(.el-upload) {
    --el-upload-dragger-padding-horizontal: 1rem;
  }
}
</style>
