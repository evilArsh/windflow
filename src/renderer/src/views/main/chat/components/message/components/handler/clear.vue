<script lang="ts" setup>
import { ChatMessageContextFlag, ChatMessageTree, ChatTopic, SettingKeys } from "@windflow/core/types"
import { errorToText, isArrayLength } from "@toolmain/shared"
import { ElMessageBox } from "element-plus"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"
import { createChatMessage } from "@windflow/core/message"
import { msg } from "@renderer/utils"
import { useShortcutBind } from "@renderer/hooks/useShortcutBind"
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
            await chatStore.deleteMessage(messages.value[0])
          } else {
            await chatStore.addChatMessage(
              createChatMessage({
                topicId: props.topic.id,
                contextFlag: ChatMessageContextFlag.BOUNDARY,
              })
            )
          }
          emit("contextClean")
        }
      }
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
}
const { key: cleanMessageKey, trigger: triggerCleanMessage } = useShortcutBind(
  SettingKeys.ChatCleanMessage,
  handler.cleanMessage
)
const { key: cleanContextKey, trigger: triggerCleanContext } = useShortcutBind(
  SettingKeys.ChatCleanContext,
  handler.cleanContext
)
</script>
<template>
  <ContentBox
    style="
      --box-border-color: var(--el-border-color-light);
      --box-border-size: 1px;
      --box-padding: 2px;
      --box-border-hover-color: var(--el-border-color-dark);
      --box-border-active-color: var(--el-border-color-darker);
    "
    normal>
    <div class="flex-center gap[--ai-gap-base]">
      <ContentBox background @click="triggerCleanMessage">
        <el-tooltip placement="top" :content="t('chat.cleanMessage', { shortcut: `(${cleanMessageKey})` })">
          <i-icon-park-outline-delete class="text-1.4rem"></i-icon-park-outline-delete>
        </el-tooltip>
      </ContentBox>
      <ContentBox background @click="triggerCleanContext">
        <el-tooltip placement="top" :content="t('chat.cleanContext', { shortcut: `(${cleanContextKey})` })">
          <i-icon-park-outline-clear-format class="text-1.4rem"></i-icon-park-outline-clear-format>
        </el-tooltip>
      </ContentBox>
    </div>
  </ContentBox>
</template>
<style lang="scss" scoped></style>
