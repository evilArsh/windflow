<script lang="ts" setup>
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/pinia/chat.store"
const charStore = useChatStore()
const { content } = storeToRefs(charStore)
const { t } = useI18n()

function send() {
  charStore.send()
}
</script>
<template>
  <div class="chat-input-container">
    <div class="chat-input">
      <el-input
        input-style="border: none;height: 100%"
        style="display: flex"
        :autosize="false"
        clearable
        autofocus
        resize="none"
        type="textarea"
        v-model="content"
        :placeholder="t('tip.inputPlaceholder')"></el-input>
    </div>
    <div class="chat-input-actions">
      <el-button type="primary" @click="send">发送</el-button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chat-input-container {
  --chat-input-actions-bg-color: transparent;
  flex: 1;
  display: flex;
  flex-direction: column;
  .chat-input {
    flex: 1;
    overflow: hidden;
    display: flex;
  }
  .chat-input-actions {
    padding: 0.5rem;
    flex-shrink: 0;
    display: flex;
    background-color: var(--chat-input-actions-bg-color);
  }
}
</style>
