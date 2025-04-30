<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Single from "./single.vue"
// import Handler from "./handler.vue"
// import Title from "./title.vue"
defineProps<{
  data: ChatMessageData[]
  parent: ChatMessageData
}>()
const id = useId()
</script>
<template>
  <MsgBubble :id>
    <template #head>
      <el-affix :offset="40" :target="`#${id}`">
        <!-- <Handler :data @edit="rawTextDlg.edit(data)"></Handler> -->
      </el-affix>
    </template>
    <template #content>
      <el-card style="--el-card-padding: 1rem" shadow="never">
        <div class="chat-item-container">
          <el-affix :offset="40" :target="`#${id}`">
            <!-- <Title :data></Title> -->
          </el-affix>
          <div class="chat-item-content">
            <Single v-for="item in data" :data="item" :key="item.id" class="flex-1"></Single>
          </div>
          <div class="chat-item-footer"></div>
        </div>
      </el-card>
    </template>
  </MsgBubble>
</template>
<style lang="scss" scoped>
.chat-item-container {
  --chat-item-content-bg-color: transparent;
  --chat-item-container-bg-color: transparent;
  --chat-item-footer-bg-color: transparent;

  background-color: var(--chat-item-container-bg-color);
  overflow: hidden;
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .chat-item-content {
    flex: 1;
    display: flex;
    background-color: var(--chat-item-content-bg-color);
    font-size: 1.4rem;
    gap: 1rem;
  }
  .chat-item-footer {
    flex-shrink: 0;
    display: flex;
    background-color: var(--chat-item-footer-bg-color);
  }
}
</style>
