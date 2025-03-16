<script lang="ts" setup>
import ds from "@renderer/assets/images/provider/deepseek.svg"
</script>
<template>
  <div class="chat-item-container">
    <div class="chat-item-header">
      <el-image class="icon" :src="ds" />
      <el-text class="name">DeepSeek</el-text>
    </div>
    <div class="chat-item-content">
      <el-text class="text">你好</el-text>
    </div>
    <div class="chat-item-footer">
      <el-text class="text">2025-03-16 12:00:00</el-text>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chat-item-container {
  --chat-item-header-height: 3rem;
  --chat-item-header-bg-color: #431c9e;
  --chat-item-content-bg-color: #1b8ae4;
  --chat-item-container-bg-color: #fd3d9d;
  --chat-item-footer-bg-color: #a430e7;

  background-color: var(--chat-item-container-bg-color);
  border-radius: 0.5rem;
  padding: 0.5rem;
  .chat-item-header {
    flex-shrink: 0;
    display: flex;
    height: var(--chat-item-header-height);
    background-color: var(--chat-item-header-bg-color);
    gap: 0.5rem;
    .icon {
      width: var(--chat-item-header-icon-size);
      height: var(--chat-item-header-icon-size);
    }
  }
  .chat-item-content {
    flex: 1;
    display: flex;
    padding: 0.5rem;
    background-color: var(--chat-item-content-bg-color);
  }
  .chat-item-footer {
    flex-shrink: 0;
    display: flex;
    padding: 0.5rem;
    background-color: var(--chat-item-footer-bg-color);
  }
}
</style>
