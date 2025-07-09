<script setup lang="ts">
import useShortcut from "@renderer/views/main/usable/useShortcut"
import ModelSelect from "./modelSelect.vue"
import TextToImage from "./textToImage.vue"
import LLMRequest from "./llmRequest.vue"
import Mcp from "./mcp.vue"
import Settings from "./settings/index.vue"
import TextInput from "./textInput.vue"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"
import useSettingsStore from "@renderer/store/settings"
import { ChatMessage, ChatTopic, SettingKeys } from "@renderer/types"
import Clear from "./clear.vue"
import { errorToText } from "@shared/error"
import { useThrottleFn } from "@vueuse/core"
import { cloneDeep } from "lodash-es"
const emit = defineEmits<{
  messageSend: []
  contextClean: []
}>()
const props = defineProps<{
  message: ChatMessage
  topic: ChatTopic
}>()
const message = computed(() => props.message)
const topic = computed(() => props.topic)

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { t } = useI18n()
const shortcut = useShortcut()
const chatStore = useChatStore()

const handler = {
  send: async (res: { active: boolean }, done?: unknown) => {
    if (res.active) {
      chatStore.send(topic.value)
      await nextTick()
      emit("messageSend")
      if (isFunction(done)) done()
    }
  },
  onTopicUpdate: useThrottleFn(async () => {
    try {
      await chatStore.api.updateChatTopic(cloneDeep(topic.value))
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  }),
}
const { key: sendShortcut, trigger: triggerSend } = shortcut.listen("enter", handler.send)
watchEffect(() => {
  if (settings.value[SettingKeys.ChatSendShortcut]) {
    sendShortcut.value = settings.value[SettingKeys.ChatSendShortcut].value as string
  }
})
</script>
<template>
  <div class="chat-input-container">
    <div class="chat-input-header">
      <div class="flex items-center gap-1rem">
        <ModelSelect :topic @change="handler.onTopicUpdate" />
        <TextToImage></TextToImage>
        <LLMRequest :topic></LLMRequest>
        <Mcp :topic></Mcp>
        <Settings :topic></Settings>
      </div>
      <Clear :message="message" :topic="topic" @context-clean="emit('contextClean')"></Clear>
    </div>
    <TextInput :message="message" :topic="topic" />
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
  gap: 0.5rem;
  .chat-input-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }
  .chat-input-actions {
    flex-shrink: 0;
    display: flex;
    background-color: var(--chat-input-actions-bg-color);
    justify-content: flex-end;
    gap: 1rem;
  }
}
</style>
