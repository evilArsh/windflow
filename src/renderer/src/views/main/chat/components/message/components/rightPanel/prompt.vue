<script lang="ts" setup>
import { ChatTopic } from "@windflow/core/types"
import useChatStore from "@renderer/store/chat"
import { errorToText, msg } from "@toolmain/shared"
import { useThrottleFn } from "@vueuse/core"
const chatStore = useChatStore()
const { t } = useI18n()

const props = defineProps<{
  topic: ChatTopic
}>()
const topic = computed<ChatTopic>(() => props.topic)
const onPromptChange = useThrottleFn(async () => {
  try {
    await chatStore.updateChatTopic(topic.value)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
})
</script>
<template>
  <div class="flex flex-col gap.5rem">
    <ContentBox>
      <template #icon>
        <i class="i-fluent-emoji-flat-flashlight"></i>
      </template>
      <el-text type="info">{{ t("chat.right.prompt") }}</el-text>
    </ContentBox>
    <el-input
      type="textarea"
      v-model="topic.prompt"
      resize="vertical"
      @input="onPromptChange"
      :autosize="{ minRows: 5, maxRows: 15 }"></el-input>
  </div>
</template>
<style lang="scss" scoped></style>
