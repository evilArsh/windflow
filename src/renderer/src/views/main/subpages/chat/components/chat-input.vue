<script lang="ts" setup>
const content = ref("")
</script>
<template>
  <div class="chat-input-container">
    <div class="chat-input">
      <el-scrollbar view-style="height: 100%">
        <el-input autosize type="textarea" v-model="content"></el-input>
      </el-scrollbar>
    </div>
    <div class="chat-input-actions">
      <el-button type="primary">发送</el-button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chat-input-container {
  --chat-input-actions-bg-color: #06d3d3;
  flex: 1;
  display: flex;
  flex-direction: column;
  .chat-input {
    flex: 1;
    overflow: hidden;
  }
  .chat-input-actions {
    padding: 0.5rem;
    flex-shrink: 0;
    display: flex;
    background-color: var(--chat-input-actions-bg-color);
  }
}
</style>
