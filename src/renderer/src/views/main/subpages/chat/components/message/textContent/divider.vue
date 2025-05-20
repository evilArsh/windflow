<script lang="ts" setup>
import { ChatMessageData } from "@renderer/types"
import useChatStore from "@renderer/store/chat.store"
import { storeToRefs } from "pinia"
import { errorToText } from "@shared/error"
const props = defineProps<{
  data: ChatMessageData
}>()
const chatStore = useChatStore()
const { currentTopic, currentMessage } = storeToRefs(chatStore)
const { t } = useI18n()
async function undoContext() {
  try {
    if (currentMessage.value) {
      chatStore.deleteSubMessage(currentTopic.value?.node, currentMessage.value, props.data.id)
      chatStore.api.updateChatMessage(currentMessage.value)
    }
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
}
</script>
<template>
  <el-divider border-style="dashed">
    <ContentBox>
      <div class="flex items-center gap.5rem">
        <el-text>{{ t("chat.contextDivider") }}</el-text>
        <i-mdi:undo-variant class="text-1.4rem" @click="undoContext"></i-mdi:undo-variant>
      </div>
    </ContentBox>
  </el-divider>
</template>
<style lang="scss" scoped></style>
