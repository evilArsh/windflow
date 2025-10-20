<script lang="ts" setup>
import useRagFilesStore from "@renderer/store/ragFiles"
import useEmbeddingStore from "@renderer/store/embedding"
import { Knowledge } from "@renderer/types/knowledge"
import { RAGLocalFileInfo } from "@shared/types/rag"
import { DialogPanel } from "@toolmain/components"
import { filesize } from "filesize"
import { CallBackFn, errorToText, msgError, uniqueId } from "@toolmain/shared"
import { Spinner } from "@toolmain/components"
import { storeToRefs } from "pinia"
const emit = defineEmits<{
  (e: "edit", knowledgeId: string, done: CallBackFn): void
}>()
const props = defineProps<{
  knowledge: Knowledge
}>()
const embeddingStore = useEmbeddingStore()
const ragFilesStore = useRagFilesStore()
const { ragFiles } = storeToRefs(ragFilesStore)
const knowledge = computed(() => props.knowledge)

const fileList = computed<RAGLocalFileInfo[]>(() => {
  return ragFiles.value[props.knowledge.id] ?? []
})
const { embeddings } = storeToRefs(embeddingStore)
const upload = {
  async chooseFile(done: CallBackFn) {
    try {
      if (window.api) {
        const res = await window.api.file.chooseFilePath()
        const infos = await window.api.file.getInfo(res.data)
        if (infos.data.length) {
          for (const info of infos.data) {
            if (!info.isFile) continue
            const req: RAGLocalFileInfo = {
              id: uniqueId(),
              path: info.path,
              topicId: props.knowledge.id,
              fileName: info.name,
              fileSize: info.size,
              mimeType: info.mimeType,
              extenstion: info.extension,
            }
            await ragFilesStore.api.add(req)
            if (!ragFiles.value[props.knowledge.id]) {
              ragFiles.value[props.knowledge.id] = []
            }
            ragFiles.value[props.knowledge.id].push(req)
          }
        }
      }
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      done()
    }
  },
}
const { t } = useI18n()
</script>
<template>
  <DialogPanel>
    <template #header>
      <Button size="small" type="warning" @click="done => emit('edit', knowledge.id, done)">
        {{ t("btn.edit") }}
      </Button>
      <el-button size="small" type="danger">{{ t("btn.delete") }} </el-button>
      <Button size="small" type="primary" @click="upload.chooseFile">
        <template #icon>
          <el-icon class="text-1.4rem"> <i class="i-ep:upload-filled"></i> </el-icon>
        </template>
        {{ t("btn.upload") }}
      </Button>
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
      <el-card class="flex flex-1 flex-col overflow-hidden" shadow="never" style="--el-card-padding: 1rem">
        <template #header>
          <el-text type="primary">{{ t("knowledge.fileList") }}</el-text>
        </template>
        <el-scrollbar>
          <ContentBox v-for="item in fileList" class="select-unset!" :key="item.id">
            <i class="i-ic:baseline-insert-drive-file text-3rem"></i>
            <ContentBox class="flex-1 select-unset!" normal>
              <el-space>
                <el-text type="primary">{{ item.fileName }}</el-text>
                <Spinner :model-value="true" class="text-1.4rem"></Spinner>
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
              <el-button size="small">button</el-button>
              <el-divider direction="vertical"></el-divider>
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
