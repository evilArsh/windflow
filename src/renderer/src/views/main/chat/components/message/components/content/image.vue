<script setup lang="ts">
import { useRequest } from "@renderer/provider/http"
import { ChatMessage } from "@renderer/types"
import { errorToText, isBase64Image, isString, msg } from "@toolmain/shared"
import useChatStore from "@renderer/store/chat"
import PQueue from "p-queue"

const props = defineProps<{
  message: ChatMessage
  parent?: ChatMessage
}>()
const chatstore = useChatStore()
const message = computed(() => props.message)
const useImages = () => {
  const images = ref<string[]>([])
  const http = useRequest()
  const queue = new PQueue()
  const isPending = ref(false)

  const blobToBase64 = async (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  async function download(url: string) {
    try {
      queue.add(async () => {
        const { promise } = http.request({
          url,
          method: "GET",
          responseType: "blob",
        })
        const res = await promise
        // FIXME: 优化图片转换
        const src = await blobToBase64(res.data)
        images.value.push(src)
      })
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  }
  queue.addListener("idle", () => (isPending.value = false))
  queue.addListener("add", () => (isPending.value = true))
  queue.addListener("active", () => (isPending.value = true))
  // queue.addListener("next", () => (isPending.value = true))
  return {
    images,
    isPending,
    abortAll: () => {
      http.abortAll()
      queue.clear()
    },
    addBase64: (img: string) => images.value.push(img),
    clearImages: () => (images.value.length = 0),
    download,
    dispose: () => {
      queue.removeAllListeners()
      abortAll()
    },
  }
}
const { images, download, isPending, abortAll, dispose, addBase64, clearImages } = useImages()
watch(
  () => message.value.content,
  value => {
    if (Array.isArray(value.content)) {
      if (value.content.some((item: string | Record<string, unknown>) => isString(item) && !isBase64Image(item))) {
        abortAll()
        clearImages()
        value.content.forEach((url: unknown) => {
          if (!isString(url)) return
          if (isBase64Image(url)) {
            addBase64(url)
            return
          }
          download(url)
        })
      } else {
        clearImages()
        value.content.filter(v => isString(v)).forEach(addBase64)
      }
    } else {
      clearImages()
    }
  },
  { immediate: true }
)
watch(isPending, val => {
  if (val) return
  if (!images.value.length) return
  message.value.content.content = Array.from(images.value)
  if (props.parent) {
    chatstore.updateChatMessage(props.parent)
  } else {
    chatstore.updateChatMessage({
      ...message.value,
      content: {
        ...message.value.content,
        content: Array.from(images.value),
      },
    })
  }
})
onBeforeUnmount(dispose)
</script>
<template>
  <div class="flex gap-.5rem">
    <el-image
      v-for="(img, index) in images"
      :key="index"
      preview-teleported
      :preview-src-list="images"
      :src="img"
      loading="lazy"></el-image>
  </div>
</template>
<style lang="scss" scoped></style>
