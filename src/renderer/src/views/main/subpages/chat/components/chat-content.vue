<script setup lang="ts">
import ds from "@renderer/assets/images/provider/deepseek.svg"
import { ChatTopic, LLMProvider, ModelType, ProviderName } from "@renderer/types"
import useProviderStore from "@renderer/store/provider.store"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/views/main/components/markdown/index.vue"
import useScrollHook from "./useScrollHook"
const emit = defineEmits<{
  (e: "update:modelValue", value: ChatTopic): void
}>()
const props = defineProps<{
  modelValue: ChatTopic
}>()
const topic = computed<ChatTopic>({
  get() {
    return props.modelValue
  },
  set(value) {
    emit("update:modelValue", value)
  },
})

const contentLayout = useTemplateRef<InstanceType<typeof ContentLayout>>("contentLayout")
const providerStore = useProviderStore()
const { t } = useI18n()
const layoutReverse = computed(() => {
  return (name: ProviderName) => {
    return providerStore.find(name)?.name === ProviderName.System
  }
})
const llmChats = shallowReactive<Record<string, LLMProvider>>({})

const send = async () => {
  if (!topic.value.content.trim()) return
  topic.value.chatMessages.push({
    id: uniqueId(),
    status: 200,
    time: formatSecond(new Date()),
    finish: true,
    reasoning: false,
    content: {
      role: "user",
      content: topic.value.content,
    },
    model: {
      id: "",
      name: "",
      type: ModelType.LLM_CHAT,
      providerName: ProviderName.System,
    },
  } as ChatTopic["chatMessages"][number])
  for (const model of topic.value.models) {
    const provider = providerStore.find(model.providerName)
    if (provider) {
      const message = reactive<ChatTopic["chatMessages"][number]>({
        id: uniqueId(),
        finish: false,
        status: 200,
        time: formatSecond(new Date()),
        content: {
          role: "assistant",
          content: "",
        },
        model,
      })
      topic.value.chatMessages.push(message)
      if (!llmChats[model.providerName]) {
        const provider = providerStore.providerManager.getLLMProvider(model.providerName)
        if (provider) {
          llmChats[model.providerName] = provider
        } else {
          console.warn("[init llmChats] provider not found", model.providerName)
        }
      }
      const context = topic.value.chatMessages.filter(item => item.finish).map(item => item.content)
      llmChats[model.providerName].chat(context, async msg => {
        if (!contentLayout.value?.isScrolling() && contentLayout.value?.arrivedState().bottom) {
          contentLayout.value?.scrollToBottom("smooth")
        }
        message.status = msg.status
        if (msg.status == 206) {
          message.finish = false
          message.content.content += msg.data.map(item => item.content).join("")
          message.content.reasoningContent += msg.data.map(item => item.reasoningContent).join("")
        } else if (msg.status == 200) {
          contentLayout.value?.scrollToBottom("instant")
          message.finish = true
          console.log("done")
        } else {
          message.finish = true
        }
      })
    }
  }
  topic.value.content = ""
  nextTick(() => {
    contentLayout.value?.scrollToBottom("smooth")
  })
}
const { onScroll } = useScrollHook(contentLayout, topic)
</script>
<template>
  <ContentLayout handler-height="20rem" ref="contentLayout" @scroll="onScroll">
    <template #content>
      <MsgBubble v-for="item in topic.chatMessages" :key="item.id" :reverse="layoutReverse(item.model.providerName)">
        <template #head>
          <Hover>
            <el-avatar :src="ds" size="default" />
          </Hover>
        </template>
        <template #content>
          <div class="chat-item-container">
            <div class="chat-item-header" :class="{ reverse: layoutReverse(item.model.providerName) }">
              <el-text class="name">{{ providerStore.find(item.model.providerName)?.name }}</el-text>
              <el-text class="time">{{ item.time }}</el-text>
            </div>
            <div class="chat-item-content" :class="{ reverse: layoutReverse(item.model.providerName) }">
              <el-button v-if="item.status == 100" type="primary" loading circle size="small"></el-button>
              <Markdown :id="item.id" :content="item.content" :partial="!item.finish" />
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
          <Hover>
            <el-button size="small" type="primary" @click="send" circle>
              <i-ic:baseline-file-upload class="text-1.6rem"></i-ic:baseline-file-upload>
            </el-button>
          </Hover>
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
    &.reverse {
      align-items: flex-end;
    }
  }
  .chat-item-content {
    flex: 1;
    display: flex;
    background-color: var(--chat-item-content-bg-color);
    font-size: 1.4rem;
    &.reverse {
      justify-content: flex-end;
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
    justify-content: flex-end;
  }
}
</style>
