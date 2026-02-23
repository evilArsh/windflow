<script setup lang="ts">
import { ChatMessage, ChatMessageTree } from "@windflow/core/types"
import { isArrayLength } from "@toolmain/shared"
import useChatStore from "@renderer/store/chat"
import { useSrc } from "@renderer/hooks/useSrc"

const props = defineProps<{
  message: ChatMessageTree
  parent?: ChatMessageTree
}>()
const chatstore = useChatStore()
const message = computed(() => props.message.node)

const { data, isPending, ...src } = useSrc()
function onMessageChange(value: ChatMessage) {
  if (isArrayLength(value.mediaIds)) {
    value.mediaIds.forEach(src.retrieveFromDB)
  }
}
watch(
  () => message.value.mediaIds,
  () => onMessageChange(message.value)
)
// FIXME: remove async function updateChatMessage out of watch
watch(isPending, val => {
  if (val) return
  if (!data.value.length) return
  message.value.content.content = Array.from(data.value)
  if (props.parent) {
    chatstore.updateChatMessage(props.parent.node)
  } else {
    chatstore.updateChatMessage({
      ...message.value,
      content: {
        ...message.value.content,
        content: Array.from(data.value),
      },
    })
  }
})
onBeforeMount(() => {
  onMessageChange(message.value)
})
onBeforeUnmount(src.dispose)
</script>
<template>
  <div class="flex gap-.5rem">
    <el-image
      v-for="(img, index) in data"
      :key="index"
      preview-teleported
      :preview-src-list="data"
      :src="img"
      loading="lazy"></el-image>
  </div>
</template>
<style lang="scss" scoped></style>
