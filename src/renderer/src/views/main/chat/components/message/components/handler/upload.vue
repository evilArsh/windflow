<script setup lang="ts">
import type { ChatTopic } from "@windflow/core/types"
// import useChatStore from "@renderer/store/chat"
// import { storeToRefs } from "pinia"
import Shell from "./components/shell.vue"
import { UploadFile, UploadFiles, UploadUserFile } from "element-plus"
import { isArrayLength } from "@toolmain/shared"
import { msgWarning } from "@renderer/utils"
// import { useTask } from "@renderer/hooks/useTask"
// import PQueue from "p-queue"

defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
// const chatStore = useChatStore()
// const { chatLLMConfig } = storeToRefs(chatStore)
// const { isPending, add } = useTask(new PQueue({ concurrency: 1 }))
const imagesExtensions = [".jpg", ".jpeg", ".png", ".bmp", ".webp"]
const filesExtensions = [".xls", ".xlsx", ".doc", ".docx", ".pdf"]
const maxSize = 1024 * 1024 * 100
const allowedExtensions = [...imagesExtensions, ...filesExtensions]
const fileList = shallowRef<UploadUserFile[]>([])
const visible = computed(() => isArrayLength(fileList.value))
function handleChange(uploadFile: UploadFile, uploadFiles: UploadFiles) {
  if (!uploadFile.raw) return
  const size = uploadFile.raw.size
  const name = uploadFile.name
  if (!allowedExtensions.some(ext => name.endsWith(ext))) {
    msgWarning(t("chat.fileTypeNotSupported"))
    return
  }
  if (size > maxSize) {
    msgWarning(t("chat.fileTooLarge"))
    return
  }
  console.log(uploadFile, uploadFiles)
}
</script>
<template>
  <Shell :visible :width="300">
    <template #reference>
      <el-upload
        class="flex"
        multiple
        :limit="50"
        :accept="allowedExtensions.join(',')"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleChange">
        <ContentBox class="custom-box" background>
          <div class="flex-center p[var(--ai-gap-small)] gap[var(--ai-gap-base)]">
            <i-material-symbols-upload class="icon"></i-material-symbols-upload>
            <el-text>{{ t("chat.upload") }}</el-text>
          </div>
        </ContentBox>
      </el-upload>
    </template>
    <template #default>
      <div class="h-30px flex items-center">
        <div>{{ fileList.map(f => f.name) }}</div>
      </div>
    </template>
  </Shell>
</template>
<style lang="scss" scoped>
.custom-box {
  --box-border-color: var(--el-border-color-light);
  --box-border-radius: 1rem;
  --box-border-size: 1px;
  --box-padding: 0;
  .icon {
    font-size: 1.6rem;
  }
}
</style>
