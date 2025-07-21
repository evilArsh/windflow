<script setup lang="ts">
import { useRequest } from "@renderer/lib/provider/http"
import { ChatMessage } from "@renderer/types"
import { errorToText } from "@shared/error"
import useChatStore from "@renderer/store/chat"
import PQueue from "p-queue"

const props = defineProps<{
  message: ChatMessage
}>()
const chatstore = useChatStore()
const message = computed(() => props.message)
const useImages = () => {
  const images = ref<string[]>([])
  const http = useRequest()
  const queue = new PQueue()

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
  return {
    images,
    isPending: () => queue.size > 0 || queue.pending > 0,
    abortAll: http.abortAll,
    addBase64: (img: string) => images.value.push(img),
    clearImages: () => (images.value.length = 0),
    download,
  }
}
const { images, download, isPending, abortAll, addBase64, clearImages } = useImages()
watch(
  () => message.value.content.content,
  value => {
    if (Array.isArray(value)) {
      abortAll()
      clearImages()
      value.forEach((url: unknown) => {
        if (!isString(url)) return
        if (isBase64Image(url)) {
          addBase64(url)
          return
        }
        download(url)
      })
    }
  },
  { immediate: true }
)
watch(
  images,
  val => {
    if (!val.length) return
    chatstore.api.updateChatMessage({
      ...message.value,
      content: {
        ...message.value.content,
        content: val,
      },
    })
    if (isPending()) return
    message.value.content.content = val
  },
  { deep: true }
)
onBeforeUnmount(abortAll)
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
