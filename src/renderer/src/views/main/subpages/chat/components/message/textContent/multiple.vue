<script setup lang="ts">
import { ChatMessage, ChatMessageData, ChatTopic } from "@renderer/types/chat"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Single from "./single.vue"
import Handler from "./handler.vue"
import useChatStore from "@renderer/store/chat"
const props = defineProps<{
  message: ChatMessage
  messageItem: ChatMessageData
  topic: ChatTopic
}>()
const id = useId()
const chatStore = useChatStore()
async function del(messageItem: ChatMessageData) {
  if (isArray(messageItem.children)) {
    messageItem.children
      .map(item => item.id)
      .forEach(childId => {
        chatStore.deleteSubMessage(props.topic, childId, messageItem.id)
      })
    chatStore.api.updateChatMessage(props.message)
  }
}
</script>
<template>
  <MsgBubble :id>
    <template #header>
      <div class="flex items-center px-1rem py-.5rem">
        <Handler hide-edit :topic :message :message-item @delete="del(messageItem)"></Handler>
        <el-divider direction="vertical" border-style="dashed" />
      </div>
    </template>
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
