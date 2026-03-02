<script setup lang="ts">
import type { ChatLLMConfig, ChatTopic } from "@windflow/core/types"
import useChatStore from "@renderer/store/chat"
import { msgError } from "@renderer/utils"
import { errorToText } from "@toolmain/shared"
import { storeToRefs } from "pinia"
const props = defineProps<{
  disabled?: boolean
  topic: ChatTopic
}>()
const topic = computed(() => props.topic)
const chatStore = useChatStore()
const { chatLLMConfig } = storeToRefs(chatStore)
const config = computed<ChatLLMConfig | undefined>(() => chatLLMConfig.value[topic.value.id])
const { t } = useI18n()
const onClick = async () => {
  try {
    if (!config.value) return
    config.value.reasoning = !config.value.reasoning
    await chatStore.updateChatLLMConfig(config.value)
  } catch (error) {
    msgError(errorToText(error))
  }
}
</script>
<template>
  <ContentBox
    :disabled
    class="custom-box"
    :class="{ reasoning: config?.reasoning }"
    style="--ai-gap-base: 0"
    :default-lock="config?.reasoning"
    need-lock
    background
    normal-icon
    @click="onClick">
    <template #icon>
      <i-solar-atom-broken class="icon"></i-solar-atom-broken>
    </template>
    <span>{{ t("chat.deepThinking") }}</span>
  </ContentBox>
</template>
<style lang="scss" scoped>
.custom-box {
  --box-border-radius: 1rem;

  --box-border-hover-color: var(--el-color-primary-light-5);
  --box-border-active-color: var(--el-color-primary-light-3);

  --box-bg-active-color: var(--el-color-primary-light-9);
  --box-text-active-color: var(--el-color-primary);
  .icon {
    font-size: 1.4rem;
  }
  &.active {
    .icon {
      color: var(--el-color-primary);
    }
  }
}
</style>
