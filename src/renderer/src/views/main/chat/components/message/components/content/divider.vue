<script lang="ts" setup>
import { ChatMessageTree, ChatTopic } from "@renderer/types"
import useChatStore from "@renderer/store/chat"
import { CallBackFn, errorToText, msg } from "@toolmain/shared"
const props = defineProps<{
  message: ChatMessageTree
  topic: ChatTopic
}>()
const chatStore = useChatStore()
const { t } = useI18n()
async function undoContext(done: CallBackFn) {
  try {
    await chatStore.deleteMessage(props.topic, props.message)
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
        <Button text @click="undoContext" size="small">
          <i-mdi:undo-variant class="text-1.4rem"></i-mdi:undo-variant>
        </Button>
      </div>
    </ContentBox>
  </el-divider>
</template>
<style lang="scss" scoped></style>
