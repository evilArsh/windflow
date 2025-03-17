<script lang="ts" setup>
import ds from "@renderer/assets/images/provider/deepseek.svg"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
// import { storeToRefs } from "pinia"
// import useChatStore from "@renderer/pinia/chat.store"
// const charStore = useChatStore()
// const { content } = storeToRefs(charStore)
</script>
<template>
  <MsgBubble>
    <template #head>
      <Hover>
        <el-avatar :src="ds" size="default" />
      </Hover>
    </template>
    <template #content>
      <div class="chat-item-container">
        <div class="chat-item-header">
          <el-text class="name">DeepSeek</el-text>
          <el-text class="time">2025-03-16 12:00:00</el-text>
        </div>
        <div class="chat-item-content">
          <el-text class="text">你好</el-text>
        </div>
        <div class="chat-item-footer"></div>
      </div>
    </template>
  </MsgBubble>
</template>
<style lang="scss" scoped>
.chat-item-container {
  --chat-item-header-bg-color: transparent;
  --chat-item-content-bg-color: transparent;
  --chat-item-container-bg-color: transparent;
  --chat-item-footer-bg-color: transparent;

  background-color: var(--chat-item-container-bg-color);
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  .chat-item-header {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--chat-item-header-bg-color);
    gap: 0.5rem;
    .name {
      align-self: unset;
      font-size: 1.4rem;
      font-weight: 600;
    }
    .time {
      align-self: unset;
      font-size: 1.2rem;
    }
  }
  .chat-item-content {
    flex: 1;
    display: flex;
    background-color: var(--chat-item-content-bg-color);
    font-size: 1.4rem;
  }
  .chat-item-footer {
    flex-shrink: 0;
    display: flex;
    background-color: var(--chat-item-footer-bg-color);
  }
}
</style>
