<script setup lang="ts">
import ModelSelect from "./modelSelect.vue"
import TextToImage from "./textToImage.vue"
import LLMRequestConfig from "./llmRequest.vue"
import Mcp from "./mcp.vue"
import KnowledgeBase from "./kb.vue"
import Settings from "./settings/index.vue"
import TextInput from "./textInput.vue"
import Reasoning from "./reasoning.vue"
import Upload from "./upload.vue"
import useChatStore from "@renderer/store/chat"
import useModelStore from "@renderer/store/model"
import { ChatTopic, SettingKeys } from "@windai/core/types"
import Clear from "./clear.vue"
import { CallBackFn, errorToText, isFunction } from "@toolmain/shared"
import { msg } from "@renderer/utils"
import { useThrottleFn } from "@vueuse/core"
import { useShortcutBind } from "@renderer/hooks/useShortcutBind"
import { isChatType, isImageType } from "@windai/core/models"
const emit = defineEmits<{
  messageSend: []
  contextClean: []
  toggleSimpleInput: []
}>()
const props = defineProps<{
  simple?: boolean
  topic: ChatTopic
}>()
const topic = computed(() => props.topic)
const { t } = useI18n()
const modelStore = useModelStore()
const chatStore = useChatStore()
const curModels = computed(() => modelStore.findByIds(props.topic.modelIds))
const curIsChatType = computed(() => curModels.value.some(isChatType))
const curIsImageType = computed(() => curModels.value.some(isImageType))
const requestCount = computed(() => props.topic.requestCount)
const handler = {
  onSend: async (active: boolean, _key: string, done?: unknown) => {
    try {
      if (active) {
        if (!topic.value.content.replaceAll(/[\r\n\s]/g, "")) {
          isFunction(done) && done()
          return
        }
        const content = topic.value.content
        topic.value.content = ""
        await chatStore.updateChatTopic(topic.value)
        await chatStore.send(topic.value.id, content, topic.value.modelIds)
        await nextTick()
        emit("messageSend")
        isFunction(done) && done()
      } else {
        if (/^[\r\n\s]*$/.test(topic.value.content)) {
          topic.value.content = ""
        }
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
  onToggleSimpleInput() {
    emit("toggleSimpleInput")
  },
  async onTerminate(done?: CallBackFn) {
    try {
      await chatStore.terminateAll(topic.value.id)
      done?.()
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
      done?.()
    }
  },
}
const {
  key: sendShortcut,
  trigger: triggerSend,
  taskPending,
} = useShortcutBind(SettingKeys.ChatSendShortcut, handler.onSend, {
  beforeTrigger: e => {
    const tname = (e.target as HTMLElement).tagName.toLowerCase()
    return !taskPending.value && (tname === "textarea" || tname === "input")
  },
})
</script>
<template>
  <div class="chat-input-container">
    <div class="chat-input-header">
      <div class="flex items-center gap-1rem c-[--el-text-color-regular]">
        <ModelSelect :topic @change="handler.onTopicUpdate" />
        <TextToImage :disabled="!curIsImageType" :topic></TextToImage>
        <LLMRequestConfig :disabled="!curIsChatType" :topic></LLMRequestConfig>
        <Reasoning :disabled="!curIsChatType" :topic></Reasoning>
        <Upload :disabled="!curIsChatType" :topic></Upload>
        <Mcp :disabled="!curIsChatType" :topic></Mcp>
        <KnowledgeBase :disabled="!curIsChatType" :topic></KnowledgeBase>
        <Settings :topic></Settings>
      </div>
      <div id="mini-input-area" class="flex flex-1 items-center justify-bewteen gap[var(--ai-gap-base)]"></div>
      <ContentBox @click="handler.onToggleSimpleInput">
        <i-ic-round-keyboard-arrow-down
          :class="simple ? 'rotate-180deg' : ''"
          class="text-1.6rem c-[--el-text-color-regular]"></i-ic-round-keyboard-arrow-down>
      </ContentBox>
      <Clear :topic="topic" @context-clean="emit('contextClean')"></Clear>
    </div>
    <teleport defer :disabled="!simple" to="#mini-input-area">
      <TextInput :type="simple ? 'text' : 'textarea'" :topic="topic" />
      <div class="chat-input-actions">
        <div class="flex items-center"></div>
        <div class="flex items-center gap-[var[--ai-gap-base]]">
          <ContentBox
            v-if="requestCount"
            class="info"
            :text-loading="false"
            @click="(_, done) => handler.onTerminate(done)"
            button
            :disabled="!requestCount">
            <i-solar-stop-circle-bold class="text-1.4rem"></i-solar-stop-circle-bold>
          </ContentBox>
          <Button
            :loading="taskPending"
            link
            size="small"
            type="default"
            text-loading
            plain
            @click="done => triggerSend(done)">
            {{ t("btn.send", { shortcut: sendShortcut }) }}
          </Button>
        </div>
      </div>
    </teleport>
  </div>
</template>
<style lang="scss" scoped>
.info {
  --box-text-color: var(--el-color-info);
  --box-text-active-color: var(--el-color-info);
  --box-text-hover-color: var(--el-color-info);
}
.chat-input-container {
  --chat-input-bg-color: transparent;
  --chat-input-padding: var(--ai-gap-medium);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--ai-gap-base);
  padding: var(--chat-input-padding);
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
    background-color: var(--chat-input-bg-color);
    justify-content: space-between;
    align-items: center;
    gap: var(--ai-gap-base);
  }
}
</style>
