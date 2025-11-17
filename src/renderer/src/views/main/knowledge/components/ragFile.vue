<script lang="ts" setup>
import useRagFilesStore from "@renderer/store/ragFiles"
import useEmbeddingStore from "@renderer/store/embedding"
import useKnowledgeStore from "@renderer/store/knowledge"
import { Knowledge } from "@renderer/types/knowledge"
import { RAGLocalFileInfo } from "@shared/types/rag"
import { DialogPanel } from "@toolmain/components"
import { CallBackFn, errorToText, msgError } from "@toolmain/shared"
import { storeToRefs } from "pinia"
import FileItem from "./fileItem.vue"
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
          size="small"
          :confirm="done => emit('remove', knowledge.id, done)">
          <template #reference="{ loading, disabled }">
            <el-button :loading :disabled size="small" type="danger">
              {{ t("btn.delete") }}
            </el-button>
          </template>
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
        body-class="overflow-hidden"
        shadow="never"
        style="--el-card-padding: 1rem; --el-card-bg-color: var(--el-fill-color-light)">
        <template #header>
          <el-text type="primary">{{ t("knowledge.fileList") }}</el-text>
        </template>
        <FileItem :file-list></FileItem>
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
