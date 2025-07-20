<script lang="ts" setup>
import { ChatMessage, ChatTopic } from "@renderer/types"
import useChatStore from "@renderer/store/chat"
import { errorToText } from "@shared/error"
import { CallBackFn } from "@renderer/lib/shared/types"
const props = defineProps<{
  message: ChatMessage
  topic: ChatTopic
}>()
const chatStore = useChatStore()
const { t } = useI18n()
async function undoContext(done: CallBackFn) {
  try {
    await chatStore.deleteMessage(props.topic, props.message.id)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  } finally {
    done()
  }
}
</script>
<template>
  <el-divider border-style="dashed">
    <ContentBox>
      <div class="flex items-center gap.5rem">
        <el-text>{{ t("chat.contextDivider") }}</el-text>
        <Button text @click="undoContext">
          <i-mdi:undo-variant class="text-1.4rem"></i-mdi:undo-variant>
        </Button>
      </div>
    </ContentBox>
  </el-divider>
</template>
<style lang="scss" scoped></style>
