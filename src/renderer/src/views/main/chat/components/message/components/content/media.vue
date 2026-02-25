<script setup lang="ts">
import { ChatMessage } from "@windflow/core/types"
import { useSrc } from "@renderer/hooks/useSrc"

const props = defineProps<{
  message: ChatMessage
}>()
const { data, ...src } = useSrc()
function onMessageChange(message: ChatMessage) {
  src.retrieveFromDB(message.mediaIds)
}
watch(
  () => props.message.mediaIds,
  () => onMessageChange(props.message)
)
onBeforeMount(() => {
  onMessageChange(props.message)
})
onBeforeUnmount(src.dispose)
</script>
<template>
  <div v-if="data.length" class="flex items-center gap-.5rem">
    <div v-for="item in data" class="w-5rem h-5rem relative" :key="item.id">
      <el-image
        fit="contain"
        v-if="item.type === 'image'"
        :preview-src-list="data.map(v => v.url)"
        :initial-index="data.findIndex(v => v.id === item.id)"
        :src="item.url"></el-image>
      <audio v-else-if="item.type === 'audio'" :src="item.url"></audio>
      <video v-else-if="item.type === 'video'" :src="item.url"></video>
      <i-ep-document v-else class="text-1.8rem"></i-ep-document>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
