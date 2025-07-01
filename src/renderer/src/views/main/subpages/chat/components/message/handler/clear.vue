<script lang="ts" setup>
import { ChatMessage, ChatTopic } from "@renderer/types"
import useShortcut from "@renderer/views/main/usable/useShortcut"
import { errorToText } from "@shared/error"
import { ElMessageBox } from "element-plus"
import useChatStore from "@renderer/store/chat"
const props = defineProps<{
  message: ChatMessage
  topic: ChatTopic
}>()
const emit = defineEmits<{
  contextClean: []
}>()
const message = computed(() => props.message)
const topic = computed(() => props.topic)
const shortcut = useShortcut()
const chatStore = useChatStore()
const { t } = useI18n()
const handler = {
  openTip: async (msg: string) => {
    try {
      await ElMessageBox.confirm(msg, t("tip.tip"), {
        type: "warning",
        confirmButtonText: t("btn.confirm"),
        cancelButtonText: t("btn.cancel"),
        cancelButtonClass: "mx-1rem",
      })
      return true
    } catch (_e) {
      return false
    }
  },
  cleanMessage: async (res: { active: boolean }) => {
    try {
      if (res.active) {
        const confirm = await handler.openTip(`${t("tip.deleteConfirm", { message: t("chat.messageRecord") })}`)
        if (confirm && message.value) {
          for (const messageItem of message.value.data) {
            chatStore.deleteSubMessage(topic.value, messageItem.id)
          }
          message.value.data = []
          await chatStore.api.updateChatMessage(message.value)
        }
      }
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  cleanContext: async (res: { active: boolean }) => {
    try {
      if (res.active) {
        if (message.value && message.value.data.length > 0) {
          if (message.value.data[0].contextFlag) {
            chatStore.deleteSubMessage(topic.value, message.value.data[0].id)
          } else {
            message.value.data.unshift({
              contextFlag: true,
              id: uniqueId(),
              modelId: "",
              time: formatSecond(Date.now()),
              content: { role: "", content: "" },
              status: 200,
            })
          }
          await chatStore.api.updateChatMessage(message.value)
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
  <div class="flex gap.5rem bg-#9f9f9f40 b-rd-.5rem">
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
