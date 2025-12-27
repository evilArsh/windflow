<script setup lang="ts">
import useChatStore from "@renderer/store/chat"
import { ChatTopic } from "@windflow/core/types"
import { errorToText, msg } from "@toolmain/shared"
import { useThrottleFn } from "@vueuse/core"
const props = defineProps<{
  topic: ChatTopic
}>()
const { t } = useI18n()
const chatStore = useChatStore()
const topic = computed(() => props.topic)
const onInput = useThrottleFn(async () => {
  try {
    await chatStore.updateChatTopic(topic.value)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
})
</script>
<template>
  <div class="chat-input">
    <el-input
      class="textarea"
      input-style="border: none;height: 100%"
      @input="onInput"
      style="display: flex"
      :autosize="false"
      clearable
      autofocus
      resize="none"
      type="textarea"
      v-model="topic.content"
      :placeholder="t('tip.inputPlaceholder')"></el-input>
  </div>
</template>
<style lang="scss" scoped>
.chat-input {
  .textarea {
    --el-input-border-color: transparent;
    --el-input-hover-border-color: transparent;
    --el-input-focus-border-color: transparent;
    --el-input-bg-color: transparent;
  }
  flex: 1;
  overflow: hidden;
  display: flex;
}
</style>
