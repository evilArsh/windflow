<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import useModelsStore from "@renderer/store/model.store"
defineProps<{
  data: ChatMessageData
}>()
const modelsStore = useModelsStore()
</script>
<template>
  <div class="chat-item-header" :class="{ reverse: !data.modelId }">
    <div v-if="data.modelId" class="flex items-center gap-0.25rem">
      <el-text class="name">
        {{ modelsStore.find(data.modelId)?.providerName }}
      </el-text>
      <el-text type="danger">|</el-text>
      <el-text type="primary">{{ modelsStore.find(data.modelId)?.modelName }}</el-text>
    </div>
    <el-text size="small" class="time">{{ data.time }}</el-text>
  </div>
</template>
<style lang="scss" scoped>
.chat-item-header {
  --chat-item-header-bg-color: #fff;

  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--chat-item-header-bg-color);
  gap: 0.5rem;
  padding: 1rem 0;
  .name {
    align-self: unset;
    font-weight: 600;
  }
  .time {
    align-self: unset;
  }
  &.reverse {
    align-items: flex-end;
  }
}
</style>
