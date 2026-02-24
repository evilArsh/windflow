<script setup lang="ts">
import type { ChatTopic } from "@windflow/core/types"
import useChatStore from "@renderer/store/chat"
import Shell from "./components/shell.vue"
import { UploadFile, UploadFiles } from "element-plus"
import { isArrayLength, uniqueId } from "@toolmain/shared"
import { msgWarning } from "@renderer/utils"
import { useSrc } from "@renderer/hooks/useSrc"

const props = defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const chatStore = useChatStore()
const imagesExtensions = [".jpg", ".jpeg", ".png", ".bmp", ".webp"]
const filesExtensions = [".xls", ".xlsx", ".doc", ".docx", ".pdf"]
const maxSize = 1024 * 1024 * 100
const allowedExtensions = [...imagesExtensions, ...filesExtensions]

const { data, ...src } = useSrc()
const visible = computed(() => isArrayLength(data.value))
function onMessageChange(topic: ChatTopic) {
  src.retrieveFromDB(topic.mediaIds)
}
async function onFileChange(file: UploadFile, _files: UploadFiles) {
  try {
    if (!file.raw) return
    const size = file.raw.size
    const name = file.name
    if (!allowedExtensions.some(ext => name.toLowerCase().endsWith(ext))) {
      msgWarning(t("chat.fileTypeNotSupported"))
      return
    }
    const type = filesExtensions.some(ext => name.toLowerCase().endsWith(ext)) ? "file" : "image"
    if (size > maxSize) {
      msgWarning(t("chat.fileTooLarge"))
      return
    }
    await chatStore.addChatTempFiles(props.topic, [
      {
        id: uniqueId(),
        name,
        type,
        size,
        data: file.raw,
      },
    ])
  } catch (error) {
    console.error("[file error]", error)
  }
}
function onFileRemove(mediaId: string) {
  chatStore.removeChatTempFiles(props.topic, [mediaId])
}
watch(
  () => props.topic.mediaIds,
  () => onMessageChange(props.topic)
)
onBeforeMount(() => {
  onMessageChange(props.topic)
})
onBeforeUnmount(src.dispose)
</script>
<template>
  <Shell :visible :width="200" content-style="--dialog-scroll-view-padding: var(--ai-gap-small)">
    <template #reference>
      <el-upload
        class="flex"
        multiple
        :limit="50"
        :accept="allowedExtensions.join(',')"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="onFileChange">
        <ContentBox class="custom-box" background>
          <div class="flex-center p[var(--ai-gap-small)] gap[var(--ai-gap-base)]">
            <i-material-symbols-upload class="icon"></i-material-symbols-upload>
            <el-text>{{ t("chat.upload") }}</el-text>
          </div>
        </ContentBox>
      </el-upload>
    </template>
    <template #default>
      <div class="flex items-center gap-.5rem overflow-x-auto">
        <ContentBox v-for="item in data" background class="relative" :key="item.id">
          <i-ep-circle-close-filled
            @click.stop="onFileRemove(item.id)"
            class="c-[var(--el-color-danger)] z-100 text-1.2rem absolute right-0 top-0"></i-ep-circle-close-filled>
          <el-image
            class="h-3rem w-3rem"
            fit="contain"
            v-if="item.type === 'image'"
            :preview-src-list="data.map(v => v.url)"
            :src="item.url"></el-image>
          <audio v-else-if="item.type === 'audio'" :src="item.url"></audio>
          <video v-else-if="item.type === 'video'" :src="item.url"></video>
          <i-ep-document v-else class="h-3rem w-3rem text-1.8rem"></i-ep-document>
        </ContentBox>
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
