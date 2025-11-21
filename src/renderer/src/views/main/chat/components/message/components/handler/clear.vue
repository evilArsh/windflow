<script lang="ts" setup>
import { ChatMessageContextFlag, ChatMessageTree, ChatTopic } from "@renderer/types"
import { errorToText, isArrayLength, msg, useShortcut } from "@toolmain/shared"
import { ElMessageBox } from "element-plus"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"
const props = defineProps<{
  topic: ChatTopic
}>()
const emit = defineEmits<{
  contextClean: []
}>()
const chatStore = useChatStore()
const { chatMessage } = storeToRefs(chatStore)
const topic = computed(() => props.topic)
const messages = computed<ChatMessageTree[] | undefined>(() => chatMessage.value[props.topic.id])

const shortcut = useShortcut()
const { t } = useI18n()
const handler = {
  openTip: async (msg: string) => {
    try {
      await ElMessageBox.confirm(msg, t("tip.tip"), {
        type: "warning",
        confirmButtonText: t("btn.confirm"),
        cancelButtonText: t("btn.cancel"),
        cancelButtonClass: "mx-1rem",
        modal: false,
      })
      return true
    } catch (_e) {
      return false
    }
  },
  cleanMessage: async (active: boolean) => {
    try {
      if (active) {
        const confirm = await handler.openTip(`${t("tip.deleteConfirm", { message: t("chat.messageRecord") })}`)
        if (confirm && messages.value) {
          await chatStore.deleteAllMessage(topic.value)
        }
      }
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  cleanContext: async (active: boolean) => {
    try {
      if (active) {
        if (isArrayLength(messages.value)) {
          if (messages.value[0].node.contextFlag === ChatMessageContextFlag.BOUNDARY) {
            await chatStore.deleteMessage(topic.value, messages.value[0])
          } else {
            const newMessage = chatStore.utils.newChatMessage(
              props.topic.id,
              chatStore.utils.findMaxMessageIndex(messages.value),
              {
                contextFlag: ChatMessageContextFlag.BOUNDARY,
                content: { role: "", content: "" },
              }
            )
            await chatStore.addChatMessage(newMessage, 0)
          }
          emit("contextClean")
        }
      }
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
}
const { key: cleanMessageKey, trigger: triggerCleanMessage } = shortcut.listen("ctrl+l", handler.cleanMessage)
const { key: cleanContextKey, trigger: triggerCleanContext } = shortcut.listen("ctrl+k", handler.cleanContext)
</script>
<template>
  <div class="flex gap.5rem bg-[var(--el-fill-color-darker)] b-rd-.5rem p-[var(--ai-gap-small)]">
    <ContentBox background @click="triggerCleanMessage">
      <el-tooltip placement="top" :content="t('chat.cleanMessage', { shortcut: cleanMessageKey })">
        <i-icon-park-outline:delete class="text-1.4rem"></i-icon-park-outline:delete>
      </el-tooltip>
    </ContentBox>
    <ContentBox background @click="triggerCleanContext">
      <el-tooltip placement="top" :content="t('chat.cleanContext', { shortcut: cleanContextKey })">
        <i-icon-park-outline:clear-format class="text-1.4rem"></i-icon-park-outline:clear-format>
      </el-tooltip>
    </ContentBox>
  </div>
</template>
<style lang="scss" scoped></style>
