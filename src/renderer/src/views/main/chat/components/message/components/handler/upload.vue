<script setup lang="ts">
import type { ChatTopic, Media } from "@windflow/core/types"
import useChatStore from "@renderer/store/chat"
import Shell from "./components/shell.vue"
import { CallBackFn, code2xx, errorToText, isArrayLength, Response, uniqueId } from "@toolmain/shared"
import { msgError, msgWarning } from "@renderer/utils"
import { useSrc } from "@renderer/hooks/useSrc"
import { useTask } from "@renderer/hooks/useTask"
import PQueue from "p-queue"
import { FileInfo } from "@windflow/shared"
import MediaComp from "@renderer/components/Media/index.vue"

const props = defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const chatStore = useChatStore()
const imagesExtensions = ["jpg", "jpeg", "png", "bmp", "webp"]
const filesExtensions = ["xls", "xlsx", "doc", "docx", "pdf"]
const maxSize = 1024 * 1024 * 100
const allowedExtensions = [...imagesExtensions, ...filesExtensions]
const queue = useTask(new PQueue())

const { data, ...src } = useSrc()
const visible = computed(() => isArrayLength(data.value))
function onMessageChange(topic: ChatTopic) {
  src.retrieveFromDB(topic.mediaIds)
}
function onChooseFile(_: MouseEvent, done?: CallBackFn) {
  queue.add(async () => {
    try {
      if (window.api) {
        const res = await window.api.file.chooseFilePath(allowedExtensions)
        if (!res.data.length) return
        const infos = await window.api.file.getInfo(res.data)
        const available = infos.data.filter(
          info => info.isFile && info.size < maxSize && allowedExtensions.some(e => e === info.extension.toLowerCase())
        )
        if (!isArrayLength(available)) {
          return
        }
        const datas = await Promise.all(
          available.map(val => {
            return new Promise<{ info: FileInfo } & Response<string[]>>((resolve, reject) => {
              window.api.rag
                .readFileAsText(val.path, { maxFileChunks: 9999, maxTokens: -1 })
                .then(res => {
                  resolve({
                    info: val,
                    ...res,
                  })
                })
                .catch(err => {
                  reject(err)
                })
            })
          })
        )
        const effectData = datas
          .filter(data => code2xx(data.code) && data.data.length)
          .map<Media>(val => {
            return {
              id: uniqueId(),
              name: val.info.name,
              type: imagesExtensions.some(ext => val.info.extension.toLowerCase() === ext) ? "image" : "file",
              size: val.info.size,
              data: val.data.join("\n"),
              path: val.info.path,
              extension: val.info.extension,
            }
          })
        if (!isArrayLength(effectData)) {
          msgWarning(t("chat.fileUnrecognized"))
          return
        }
        console.log(effectData)
        await chatStore.addChatTempFiles(props.topic, effectData)
      }
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      done?.()
    }
  })
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
onBeforeUnmount(() => {
  src.dispose()
  queue.clear()
})
</script>
<template>
  <Shell :visible :width="300" content-style="--dialog-scroll-view-padding: var(--ai-gap-small)">
    <template #reference>
      <ContentBox class="custom-box" style="--ai-gap-base: 0" @click="onChooseFile" background button normal-icon>
        <template #icon>
          <i-material-symbols-upload class="icon"></i-material-symbols-upload>
        </template>
        <span>{{ t("chat.upload") }}</span>
      </ContentBox>
    </template>
    <template #default>
      <div class="flex items-center gap-.5rem p-[var(--ai-gap-base)] overflow-x-auto">
        <ContentBox v-for="item in data" background class="relative" :key="item.id">
          <i-ep-circle-close-filled
            @click.stop="onFileRemove(item.id)"
            class="c-[var(--el-color-danger)] z-100 text-1.2rem absolute right-0 top-0"></i-ep-circle-close-filled>
          <MediaComp :data="item"></MediaComp>
        </ContentBox>
      </div>
    </template>
  </Shell>
</template>
<style lang="scss" scoped>
.custom-box {
  --box-border-radius: 1rem;
  .icon {
    font-size: 1.4rem;
  }
}
</style>
