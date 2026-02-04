<script setup lang="ts">
import { ChatMessageTree } from "@windflow/core/types"
import useModelsStore from "@renderer/store/model"
import { formatSecond, toNumber } from "@toolmain/shared"
import { Role } from "@windflow/core/types"
const props = defineProps<{
  message: ChatMessageTree
  hideToken?: boolean
  hideTime?: boolean
  hideProvider?: boolean
  hideModel?: boolean
  reverse?: boolean
}>()
const modelsStore = useModelsStore()
const message = computed(() => props.message.node)
const isUser = computed(() => message.value.content.role === Role.User)
</script>
<template>
  <div class="chat-item-header" :class="{ reverse }">
    <div class="chat-item-title" :class="{ reverse }">
      <div v-if="!isUser" class="flex items-center gap-0.5rem flex-wrap">
        <el-text v-if="!hideProvider" class="name">
          {{ modelsStore.find(message.modelId)?.providerName }}
        </el-text>
        <el-text v-if="!hideModel" type="primary">{{ modelsStore.find(message.modelId)?.modelName }}</el-text>
      </div>
      <el-text v-if="!hideTime" size="small" class="time">{{ formatSecond(message.createAt) }}</el-text>
    </div>
    <slot></slot>
    <div v-if="!isUser && !hideToken" class="flex items-center flex-wrap">
      <ContentBox>
        <el-text type="info" size="small">tokens:</el-text>
        <ContentBox wrap-class="m0! p0!" normal>
          <i-material-symbols-arrow-upward-alt class="text-1.2rem"></i-material-symbols-arrow-upward-alt>
          <el-text type="info" size="small"> {{ toNumber(message.promptTokens) }}</el-text>
        </ContentBox>
        <ContentBox wrap-class="m0! p0!" normal>
          <i-material-symbols-arrow-downward-alt class="text-1.2rem"></i-material-symbols-arrow-downward-alt>
          <el-text type="info" size="small">{{ toNumber(message.completionTokens) }}</el-text>
        </ContentBox>
      </ContentBox>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chat-item-header {
  flex-wrap: wrap;
  border-radius: 0 var(--ai-gap-medium) var(--ai-gap-medium) 0;
  padding: var(--ai-gap-base) var(--ai-gap-medium);
  display: flex;
  align-items: center;
  gap: var(--ai-gap-base);
  &.reverse {
    flex-direction: row-reverse;
    border-radius: var(--ai-gap-medium) 0 0 var(--ai-gap-medium);
  }
}
.chat-item-title {
  display: flex;
  flex-direction: column;
  gap: var(--ai-gap-base);
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
