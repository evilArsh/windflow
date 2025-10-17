<script lang="ts" setup>
import { Knowledge } from "@renderer/types/knowledge"
import useKnowledgeStore from "@renderer/store/knowledge"
import { RAGLocalFileInfo } from "@shared/types/rag"
import useRagFilesStore from "@renderer/store/ragFiles"
import { DialogPanel } from "@toolmain/components"
import { filesize } from "filesize"
import { CallBackFn, errorToText, msgError, uniqueId } from "@toolmain/shared"
import { useDebounceFn } from "@vueuse/core"
import { Spinner } from "@toolmain/components"
const props = defineProps<{
  knowledge: Knowledge
  fileList: RAGLocalFileInfo[]
}>()
const knowledgeStore = useKnowledgeStore()
const files = computed(() => props.fileList)
const knowledge = computed(() => props.knowledge)
const ragFilesStore = useRagFilesStore()
const detail = {
  onNameChange: useDebounceFn(async name => {
    try {
      if (!name) return
      await knowledgeStore.api.update(knowledge.value)
    } catch (error) {
      msgError(errorToText(error))
    }
  }),
}
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
            files.value.push(req)
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
        <el-form :model="knowledge" inline>
          <el-form-item :label="t('knowledge.name')">
            <el-input v-model="knowledge.name" @change="detail.onNameChange"></el-input>
          </el-form-item>
          <el-form-item :label="t('knowledge.type')">
            <el-text type="primary">{{ knowledge.type }}</el-text>
          </el-form-item>
        </el-form>
      </el-card>
      <el-card class="flex flex-1 flex-col overflow-hidden" shadow="never" style="--el-card-padding: 1rem">
        <template #header>
          <el-text type="primary">{{ t("knowledge.fileList") }}</el-text>
        </template>
        <el-scrollbar>
          <ContentBox v-for="item in fileList" :key="item.id">
            <ContentBox normal>
              <i class="i-ic:baseline-insert-drive-file text-3rem"></i>
            </ContentBox>
            <ContentBox class="flex-1" normal>
              <el-space>
                <el-text size="large" type="primary">{{ item.fileName }}</el-text>
                <Spinner :model-value="true" class="text-1.4rem"></Spinner>
              </el-space>
              <template #end> </template>
              <template #footer>
                <el-space>
                  <el-text size="small" type="info">{{ filesize(item.fileSize) }}</el-text>
                  <el-link
                    style="--el-link-font-size: var(--el-font-size-extra-small)"
                    underline="always"
                    type="info"
                    >{{ item.path }}</el-link
                  >
                </el-space>
              </template>
            </ContentBox>
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
