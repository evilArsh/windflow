<script setup lang="ts">
import { ChatMessage2 } from "@renderer/types/chat"
import useModelsStore from "@renderer/store/model"
import useProviderStore from "@renderer/store/provider"
import { Role } from "@renderer/types"
const props = defineProps<{
  message: ChatMessage2
  hideToken?: boolean
  hideLogo?: boolean
  hideTime?: boolean
  hideProvider?: boolean
  hideModel?: boolean
}>()
const modelsStore = useModelsStore()
const providerStore = useProviderStore()
const message = computed(() => props.message)
const isAssistant = computed(() => props.message.content.role === Role.Assistant)
const svgSrc = computed(() =>
  providerStore.getProviderLogo(message.value.modelId ? modelsStore.find(message.value.modelId)?.providerName : "user")
)
</script>
<template>
  <div class="chat-item-header" :class="{ reverse: !isAssistant }">
    <ContentBox v-if="!hideLogo" class="m0! flex-shrink-0" background>
      <Svg :src="svgSrc" class="flex-1 text-3rem"></Svg>
    </ContentBox>
    <div class="chat-item-title" :class="{ reverse: !isAssistant }">
      <div v-if="isAssistant" class="flex items-center gap-0.5rem flex-wrap">
        <el-text v-if="!hideProvider" class="name">
          {{ modelsStore.find(message.modelId)?.providerName }}
        </el-text>
        <el-text v-if="!hideModel" type="primary">{{ modelsStore.find(message.modelId)?.modelName }}</el-text>
      </div>
      <el-text v-if="!hideTime" size="small" class="time">{{ formatSecond(message.createAt) }}</el-text>
    </div>
    <slot></slot>
    <div v-if="isAssistant && !hideToken" class="flex items-center flex-wrap">
      <ContentBox>
        <template #icon>
          <i-material-symbols:arrow-upward-alt class="text-1.2rem"></i-material-symbols:arrow-upward-alt>
        </template>
        <el-text size="small">{{ toNumber(message.promptTokens) }}</el-text>
      </ContentBox>
      <ContentBox>
        <template #icon>
          <i-material-symbols:arrow-downward-alt class="text-1.2rem"></i-material-symbols:arrow-downward-alt>
        </template>
        <el-text size="small">{{ toNumber(message.completionTokens) }}</el-text>
      </ContentBox>
    </div>
  </div>
</template>
<style lang="scss" scoped>
html.dark {
  .chat-item-header {
    --title-bg-color: #1f1f1f;
  }
}
.chat-item-header {
  --title-bg-color: #fff;
  flex-wrap: wrap;
  background-color: var(--title-bg-color);
  border-radius: 0 1rem 1rem 0;
  padding: 0.25rem 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  &.reverse {
    flex-direction: row-reverse;
    border-radius: 1rem 0 0 1rem;
  }
}
.chat-item-title {
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
