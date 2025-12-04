<script setup lang="ts">
import ModelSelect from "./modelSelect.vue"
import TextToImage from "./textToImage.vue"
import LLMRequestConfig from "./llmRequest.vue"
import Mcp from "./mcp.vue"
import KnowledgeBase from "./kb.vue"
import Settings from "./settings/index.vue"
import TextInput from "./textInput.vue"
import useChatStore from "@renderer/store/chat"
import useSettingsStore from "@renderer/store/settings"
import { ChatTopic, SettingKeys } from "@renderer/types"
import Clear from "./clear.vue"
import { errorToText, isFunction, msg, useShortcut } from "@toolmain/shared"
import { useThrottleFn } from "@vueuse/core"
const emit = defineEmits<{
  messageSend: []
  contextClean: []
}>()
const props = defineProps<{
  topic: ChatTopic
}>()
const topic = computed(() => props.topic)
const settingsStore = useSettingsStore()
const { t } = useI18n()
const shortcut = useShortcut()
const chatStore = useChatStore()
const handler = {
  onSend: async (active: boolean, _key: string, done?: unknown) => {
    try {
      if (active) {
        if (!topic.value.content.replaceAll(/[\r\n\s]/g, "")) {
          isFunction(done) && done()
          return
        }
        await chatStore.send(topic.value)
        topic.value.content = ""
        await chatStore.updateChatTopic(toValue(topic))
        await nextTick()
        emit("messageSend")
        isFunction(done) && done()
      }
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  },
  onTopicUpdate: useThrottleFn(async () => {
    try {
      await chatStore.updateChatTopic(topic.value)
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  }),
}
const {
  key: sendShortcut,
  trigger: triggerSend,
  taskPending,
} = shortcut.listen("enter", handler.onSend, {
  beforeTrigger: e => {
    return !taskPending.value && (e.target as HTMLElement).tagName.toLowerCase() === "textarea"
  },
})
settingsStore.dataBind(SettingKeys.ChatSendShortcut, sendShortcut)
</script>
<template>
  <div class="chat-input-container">
    <div class="chat-input-header">
      <div class="flex items-center gap-1rem c-[--el-text-color-regular]">
        <ModelSelect :topic @change="handler.onTopicUpdate" />
        <LLMRequestConfig :topic></LLMRequestConfig>
        <TextToImage :topic></TextToImage>
        <Mcp :topic></Mcp>
        <KnowledgeBase :topic></KnowledgeBase>
        <Settings :topic></Settings>
      </div>
      <Clear :topic="topic" @context-clean="emit('contextClean')"></Clear>
    </div>
    <TextInput :topic="topic" />
    <div class="chat-input-actions">
      <Button link size="small" type="default" plain @click="done => triggerSend(done)">
        {{ t("btn.send", { shortcut: sendShortcut }) }}
      </Button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chat-input-container {
  --chat-input-actions-bg-color: transparent;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--ai-gap-base);
  .chat-input-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--ai-gap-base);
  }
  .chat-input-actions {
    flex-shrink: 0;
    display: flex;
    background-color: var(--chat-input-actions-bg-color);
    justify-content: flex-end;
    gap: var(--ai-gap-base);
  }
}
</style>
