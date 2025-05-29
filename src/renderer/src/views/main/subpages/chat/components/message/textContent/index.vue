<script setup lang="ts">
import { ChatMessage, ChatMessageData, ChatTopic } from "@renderer/types/chat"
import Single from "./single.vue"
import Multiple from "./multiple.vue"
import Divider from "./divider.vue"
const props = defineProps<{
  message: ChatMessage
  messageItem: ChatMessageData
  topic: ChatTopic
}>()
const hasChildren = computed(() => {
  return isArray(props.messageItem.children) && props.messageItem.children.length > 0
})
</script>
<template>
  <Divider v-if="messageItem.contextFlag" :topic :message :message-item></Divider>
  <Multiple v-else-if="hasChildren" :topic :message :message-item></Multiple>
  <Single v-else :topic :message :message-item header></Single>
</template>
<style lang="scss" scoped></style>
