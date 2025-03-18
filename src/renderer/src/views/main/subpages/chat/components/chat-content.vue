<script setup lang="ts">
import ds from "@renderer/assets/images/provider/deepseek.svg"
import { ChatTopic, LLMChatRequestHandler, ProviderName } from "@renderer/types"
import useProviderStore from "@renderer/pinia/provider.store"
import { useLLMChat } from "@renderer/lib/http"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/views/main/components/markdown/index.vue"
const emit = defineEmits<{
  (e: "update:modelValue", value: ChatTopic): void
}>()
const props = defineProps<{
  modelValue: ChatTopic
}>()
const topic = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit("update:modelValue", value)
  },
})

const contentLayout = ref<InstanceType<typeof ContentLayout>>()
const providerStore = useProviderStore()
const { t } = useI18n()
const layoutReverse = computed(() => {
  return (id: string) => {
    return id === ProviderName.System
  }
})
const llmChats = shallowReactive<Record<string, LLMChatRequestHandler>>({})

const send = async () => {
  contentLayout.value?.scrollToBottom()
  topic.value.chatMessages.push({
    id: uniqueId(),
    time: formatSecond(new Date()),
    content: { content: topic.value.content, reasoningContent: "" },
    providerId: ProviderName.System,
  })
  for (const providerId of topic.value.providers) {
    const provider = providerStore.findById(providerId)
    if (provider) {
      const message = reactive<ChatTopic["chatMessages"][number]>({
        id: uniqueId(),
        time: formatSecond(new Date()),
        content: { content: "", reasoningContent: "" },
        providerId,
      })
      topic.value.chatMessages.push(message)
      if (!llmChats[providerId]) {
        llmChats[providerId] = useLLMChat(providerId)
      }
      llmChats[providerId].request(topic.value.content, async msg => {
        if (msg.status == 200) {
          message.content.content += msg.data.map(item => item.content).join("")
          message.content.reasoningContent += msg.data.map(item => item.reasoningContent).join("")
        } else {
          message.content.content = t("request.failed")
        }
      })
    }
  }
  topic.value.content = ""
}
</script>
<template>
  <ContentLayout handler-height="20rem" ref="contentLayout">
    <template #content>
      <MsgBubble v-for="item in topic.chatMessages" :key="item.id" :reverse="layoutReverse(item.providerId)">
        <template #head>
          <Hover>
            <el-avatar :src="ds" size="default" />
          </Hover>
        </template>
        <template #content>
          <div class="chat-item-container">
            <div class="chat-item-header">
              <el-text class="name">{{ providerStore.findById(item.providerId)?.name }}</el-text>
              <el-text class="time">{{ item.time }}</el-text>
            </div>
            <div class="chat-item-content" :class="{ reverse: layoutReverse(item.providerId) }">
              <Markdown :content="item.content.reasoningContent" />
            </div>
            <div class="chat-item-content" :class="{ reverse: layoutReverse(item.providerId) }">
              <Markdown :content="item.content.content" />
            </div>
            <div class="chat-item-footer"></div>
          </div>
        </template>
      </MsgBubble>
    </template>
    <template #handler>
      <div class="chat-input-container">
        <div class="chat-input">
          <el-input
            input-style="border: none;height: 100%"
            style="display: flex"
            :autosize="false"
            clearable
            autofocus
            resize="none"
            type="textarea"
            v-model="topic.content"
            :placeholder="t('tip.inputPlaceholder')"></el-input>
        </div>
        <div class="chat-input-actions">
          <el-button type="primary" @click="send">发送</el-button>
        </div>
      </div>
    </template>
  </ContentLayout>
</template>
<style lang="scss" scoped>
.chat-item-container {
  --chat-item-header-bg-color: transparent;
  --chat-item-content-bg-color: transparent;
  --chat-item-container-bg-color: transparent;
  --chat-item-footer-bg-color: transparent;

  background-color: var(--chat-item-container-bg-color);
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .chat-item-header {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--chat-item-header-bg-color);
    gap: 0.5rem;
    .name {
      align-self: unset;
      font-size: 1.4rem;
      font-weight: 600;
    }
    .time {
      align-self: unset;
      font-size: 1.2rem;
    }
  }
  .chat-item-content {
    flex: 1;
    display: flex;
    background-color: var(--chat-item-content-bg-color);
    font-size: 1.4rem;
    &.reverse {
      flex-direction: row-reverse;
    }
  }
  .chat-item-footer {
    flex-shrink: 0;
    display: flex;
    background-color: var(--chat-item-footer-bg-color);
  }
}
.chat-input-container {
  --chat-input-actions-bg-color: transparent;
  flex: 1;
  display: flex;
  flex-direction: column;
  .chat-input {
    flex: 1;
    overflow: hidden;
    display: flex;
  }
  .chat-input-actions {
    padding: 0.5rem;
    flex-shrink: 0;
    display: flex;
    background-color: var(--chat-input-actions-bg-color);
  }
}
</style>
