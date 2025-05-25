<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import useModelsStore from "@renderer/store/model"
import useProviderStore from "@renderer/store/provider"
const props = defineProps<{
  data: ChatMessageData
}>()
const modelsStore = useModelsStore()
const providerStore = useProviderStore()
const isAssistant = computed(() => !!props.data.modelId)
</script>
<template>
  <div class="chat-item-header" :class="{ reverse: !isAssistant }">
    <ContentBox class="w3.5rem h3.5rem" background>
      <Svg
        :src="providerStore.getProviderLogo(data.modelId ? modelsStore.find(data.modelId)?.providerName : 'user')"
        class="flex-1"></Svg>
    </ContentBox>
    <div class="chat-item-title" :class="{ reverse: !isAssistant }">
      <div v-if="isAssistant" class="flex items-center gap-0.25rem">
        <el-text class="name">
          {{ modelsStore.find(data.modelId)?.providerName }}
        </el-text>
        <el-text type="danger">|</el-text>
        <el-text type="primary">{{ modelsStore.find(data.modelId)?.modelName }}</el-text>
      </div>
      <el-text size="small" class="time">{{ data.time }}</el-text>
    </div>
    <el-divider direction="vertical" border-style="dashed" />
    <slot></slot>
    <div v-if="isAssistant" class="flex items-center">
      <el-divider direction="vertical" border-style="dashed" />
      <ContentBox>
        <template #icon>
          <i-material-symbols:arrow-upward-alt class="text-1.2rem"></i-material-symbols:arrow-upward-alt>
        </template>
        <el-text size="small">{{ toNumber(data.promptTokens) }}</el-text>
      </ContentBox>
      <ContentBox>
        <template #icon>
          <i-material-symbols:arrow-downward-alt class="text-1.2rem"></i-material-symbols:arrow-downward-alt>
        </template>
        <el-text size="small">{{ toNumber(data.completionTokens) }}</el-text>
      </ContentBox>
    </div>
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
  border-radius: 0 1rem 1rem 0;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
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
