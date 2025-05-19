<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import useModelsStore from "@renderer/store/model.store"
import useProviderStore from "@renderer/store/provider.store"
defineProps<{
  data: ChatMessageData
}>()
const modelsStore = useModelsStore()
const providerStore = useProviderStore()
</script>
<template>
  <div class="chat-item-header" :class="{ reverse: !data.modelId }">
    <ContentBox default-lock background>
      <Svg
        :src="providerStore.getProviderLogo(data.modelId ? modelsStore.find(data.modelId)?.providerName : 'user')"
        class="text-3rem"></Svg>
    </ContentBox>
    <div class="chat-item-title" :class="{ reverse: !data.modelId }">
      <div v-if="data.modelId" class="flex items-center gap-0.25rem">
        <el-text class="name">
          {{ modelsStore.find(data.modelId)?.providerName }}
        </el-text>
        <el-text type="danger">|</el-text>
        <el-text type="primary">{{ modelsStore.find(data.modelId)?.modelName }}</el-text>
      </div>
      <el-text size="small" class="time">{{ data.time }}</el-text>
    </div>
    <slot></slot>
  </div>
</template>
<style lang="scss" scoped>
html.dark {
  .chat-item-header {
    background-color: #1f1f1f;
  }
}
.chat-item-header {
  background-color: #fff;
  border-radius: 1rem;
  border-radius: 0 1rem 1rem 0;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 12px 0 var(--affix-shadow-color);
  transition: box-shadow 0.3s;
  &.reverse {
    flex-direction: row-reverse;
    border-radius: 1rem 0 0 1rem;
  }
}
.chat-item-title {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
