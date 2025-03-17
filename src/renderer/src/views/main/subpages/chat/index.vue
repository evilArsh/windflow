<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import Provider from "./components/provider.vue"
import Chatbox from "./components/chatbox.vue"
const keyword = ref<string>("")
</script>
<template>
  <SubNavLayout>
    <template #submenu>
      <div class="chat-provider-header">
        <el-input v-model="keyword" placeholder="搜索"></el-input>
      </div>
      <div class="chat-provider-content">
        <el-scrollbar>
          <Provider></Provider>
        </el-scrollbar>
      </div>
    </template>
    <template #content>
      <Chatbox></Chatbox>
    </template>
  </SubNavLayout>
</template>
<style lang="scss" scoped>
.chat-provider-header {
  --chat-container-padding: 0.25rem;

  flex-shrink: 0;
  flex-direction: column;
  display: flex;
  padding: var(--chat-container-padding);
  gap: 0.5rem;
}
.chat-provider-content {
  flex: 1;
  overflow: hidden;
}
</style>
