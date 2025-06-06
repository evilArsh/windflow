<script setup lang="ts">
import { ChatMessage, ChatMessageData, ChatTopic } from "@renderer/types/chat"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Single from "./single.vue"
// import Handler from "./handler.vue"
// import Title from "./title.vue"
defineProps<{
  message: ChatMessage
  messageItem: ChatMessageData
  topic: ChatTopic
}>()
const id = useId()
</script>
<template>
  <MsgBubble :id>
    <template #header> </template>
    <div class="chat-item-content">
      <Single
        v-for="item in messageItem.children"
        :parent="messageItem"
        :topic
        :message
        :message-item="item"
        :key="item.id"
        header
        class="flex-1"></Single>
    </div>
  </MsgBubble>
</template>
<style lang="scss" scoped>
.chat-item-content {
  padding: 1rem;
  flex: 1;
  display: flex;
  font-size: 1.4rem;
  gap: 1rem;
}
</style>
