<script setup lang="ts">
import { ChatMessage } from "@windflow/core/types"
import { useSrc } from "@renderer/hooks/useSrc"
import Media from "@renderer/components/Media/index.vue"

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
    <Media v-for="item in data" :data="item" :key="item.id"> </Media>
  </div>
</template>
<style lang="scss" scoped></style>
