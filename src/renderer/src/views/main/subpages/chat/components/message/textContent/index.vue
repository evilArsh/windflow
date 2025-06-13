<script setup lang="ts">
import { ChatMessage, ChatTopic } from "@renderer/types/chat"
import Single from "./single.vue"
import Multiple from "./multiple.vue"
import Divider from "./divider.vue"
defineProps<{
  topic: ChatTopic
  message?: ChatMessage
}>()
</script>
<template>
  <div v-if="message" class="flex flex-col-reverse p-1.5rem gap2.5rem">
    <div v-for="messageItem in message.data" :key="messageItem.id">
      <Divider v-if="messageItem.contextFlag" :topic :message :message-item></Divider>
      <Multiple
        v-else-if="messageItem.children && messageItem.children.length > 0"
        :topic
        :message
        :message-item></Multiple>
      <Single v-else :topic :message :message-item header></Single>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
