<script setup lang="ts">
import type { ChatLLMConfig, ModelMeta, ChatTopic } from "@windflow/core/types"
import useChatStore from "@renderer/store/chat"
import { msgError } from "@renderer/utils"
import { errorToText } from "@toolmain/shared"
import { storeToRefs } from "pinia"
const props = defineProps<{
  title?: string
  topic: ChatTopic
  filter?: (model: ModelMeta) => boolean
  single?: boolean
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
  <ContentBox class="custom-box" :default-lock="config?.reasoning" need-lock background @click="onClick">
    <div class="flex-center p[var(--ai-gap-small)] gap[var(--ai-gap-base)]">
      <i-solar-atom-broken class="icon"></i-solar-atom-broken>
      <el-text :type="config?.reasoning ? 'primary' : 'info'">{{ t("chat.deepThinking") }}</el-text>
    </div>
  </ContentBox>
</template>
<style lang="scss" scoped>
.custom-box {
  --box-border-color: var(--el-border-color-light);
  --box-border-radius: 1rem;
  --box-border-size: 1px;
  --box-padding: 0;

  --box-border-hover-color: var(--el-color-primary-light-7);
  --box-border-active-color: var(--el-color-primary-light-5);

  --box-bg-active-color: var(--el-color-primary-light-9);
  .icon {
    font-size: 1.6rem;
  }
  &.active {
    .icon {
      color: var(--el-color-primary);
    }
  }
}
</style>
