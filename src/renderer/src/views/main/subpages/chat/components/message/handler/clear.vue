<script lang="ts" setup>
import { ChatMessage, ChatTopic } from "@renderer/types"
import useShortcut from "@renderer/views/main/usable/useShortcut"
import { errorToText } from "@shared/utils"
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
const messages = computed<ChatMessage[] | undefined>(() => chatMessage.value[props.topic.id])

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
        if (confirm && messages.value) {
          for await (const messageId of messages.value.map(v => v.id)) {
            await chatStore.deleteMessage(topic.value, messageId)
          }
        }
      }
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  cleanContext: async (res: { active: boolean }) => {
    try {
      if (res.active) {
        if (messages.value && messages.value.length) {
          if (messages.value[0].contextFlag) {
            await chatStore.deleteMessage(topic.value, messages.value[0].id)
          } else {
            const newMessage = chatStore.utils.newChatMessage(props.topic.id, messages.value.length, {
              contextFlag: true,
              content: { role: "", content: "" },
            })
            await chatStore.api.addChatMessage(newMessage)
            messages.value.unshift(newMessage)
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
  <div class="flex gap.5rem bg-[var(--el-fill-color-darker)] b-rd-.5rem">
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
