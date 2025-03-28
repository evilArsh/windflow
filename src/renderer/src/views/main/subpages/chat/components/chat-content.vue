<script setup lang="ts">
import ds from "@renderer/assets/images/provider/deepseek.svg"
import { ChatTopic, ChatMessage, LLMProvider } from "@renderer/types"
import useProviderStore from "@renderer/store/provider.store"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/views/main/components/markdown/index.vue"
import useScrollHook from "../usable/useScrollHook"
import useShortcut from "../usable/useShortcut"
import useModelsStore from "@renderer/store/model.store"
import { ElMessage } from "element-plus"
import ModelTool from "./toolbox/model/index.vue"
import useSync from "../usable/useSync"
import { storeToRefs } from "pinia"
const emit = defineEmits<{
  (e: "update:modelValue", value: ChatTopic): void
}>()
const props = defineProps<{
  modelValue: ChatTopic
}>()
const topic = computed<ChatTopic>({
  get: () => props.modelValue,
  set(value) {
    emit("update:modelValue", value)
  },
})

const contentLayout = useTemplateRef<InstanceType<typeof ContentLayout>>("contentLayout")
const providerStore = useProviderStore()
const { providerMetas } = storeToRefs(providerStore)
const modelsStore = useModelsStore()
const { t } = useI18n()

const llmChats = shallowReactive<Record<string, LLMProvider>>({})

const { onScroll } = useScrollHook(contentLayout, topic)
const { message } = useSync(topic)

const send = async () => {
  if (!topic.value.content.trim()) return
  if (topic.value.modelIds.length == 0) {
    ElMessage.warning("请选择模型")
    return
  }
  message.value.data.push({
    id: uniqueId(),
    status: 200,
    time: formatSecond(new Date()),
    finish: true,
    reasoning: false,
    content: {
      role: "user",
      content: topic.value.content,
    },
    modelId: "",
  })

  for (const modelId of topic.value.modelIds) {
    if (modelId.length == 0) continue
    const model = modelsStore.find(modelId)
    const providerMeta = providerMetas.value.find(item => item.name == model?.providerName)
    if (model && providerMeta) {
      if (!llmChats[model.providerName]) {
        const provider = providerStore.providerManager.getLLMProvider(model.providerName)
        if (provider) {
          llmChats[model.providerName] = provider
        } else {
          console.warn("[init llmChats] provider not found", model.providerName)
          continue
        }
      }
      const newMsg = reactive<ChatMessage["data"][number]>({
        id: uniqueId(),
        finish: false,
        status: 200,
        time: formatSecond(new Date()),
        content: { role: "assistant", content: "", reasoningContent: "" },
        modelId,
      })
      message.value.data.push(newMsg)
      // TODO: 消息上下文
      const context = message.value.data.filter(item => item.finish && item.status < 300).map(item => item.content)

      llmChats[model.providerName].chat(context, model, providerMeta, async msg => {
        if (!contentLayout.value?.isScrolling() && contentLayout.value?.arrivedState().bottom) {
          contentLayout.value?.scrollToBottom("smooth")
        }
        newMsg.status = msg.status
        newMsg.reasoning = msg.reasoning
        newMsg.content.content += msg.data.map(item => item.content).join("")
        newMsg.content.reasoningContent += msg.data.map(item => item.reasoningContent).join("")
        if (msg.status == 206) {
          newMsg.finish = false
        } else if (msg.status == 200) {
          contentLayout.value?.scrollToBottom("instant")
          newMsg.finish = true
          console.log("done")
        } else {
          newMsg.finish = true
        }
      })
    }
  }
  topic.value.content = ""
  nextTick(() => {
    contentLayout.value?.scrollToBottom("smooth")
  })
}
const { sendShortcut } = useShortcut({
  send,
})
</script>
<template>
  <div class="flex flex-1 overflow-hidden">
    <ContentLayout v-model:handler-height="topic.inputHeight" ref="contentLayout" @scroll="onScroll">
      <template #header>
        <div class="flex p-1rem justify-end flex-1"></div>
      </template>
      <div class="flex">
        <div class="w-5rem flex-shrink-0 flex flex-col items-center py-1rem"></div>
        <div class="flex flex-col gap2rem flex-1">
          <MsgBubble v-for="item in message.data" :key="item.id" :reverse="!item.modelId">
            <template #head>
              <Hover>
                <el-avatar :src="ds" size="default" />
              </Hover>
            </template>
            <template #content>
              <div class="chat-item-container">
                <div class="chat-item-header" :class="{ reverse: !item.modelId }">
                  <el-text class="name">{{ modelsStore.find(item.modelId)?.providerName }}</el-text>
                  <el-text class="time">{{ item.time }}</el-text>
                </div>
                <div class="chat-item-content" :class="{ reverse: !item.modelId }">
                  <div v-if="item.modelId" class="flex flex-col">
                    <el-button v-show="item.status == 100 && item.reasoning" type="info" loading size="small">
                      深度思考中
                    </el-button>
                    <el-text v-show="item.content.reasoningContent" type="success" class="self-start!">
                      {{ item.content.reasoningContent }}
                    </el-text>
                    <el-text v-show="item.status == 100" type="primary" size="small">
                      <i-eos-icons:three-dots-loading class="text-4rem"></i-eos-icons:three-dots-loading>
                    </el-text>
                    <Markdown :id="item.id" :content="item.content" :partial="!item.finish" />
                  </div>
                  <el-text v-else type="primary" class="self-end!">
                    {{ item.content.content }}
                  </el-text>
                </div>
                <div class="chat-item-footer"></div>
              </div>
            </template>
          </MsgBubble>
        </div>
        <div class="w-4rem"></div>
      </div>

      <template #handler>
        <div class="chat-input-container" ref="scale">
          <div class="chat-input-header">
            <ModelTool v-model="topic.modelIds" />
          </div>
          <div class="chat-input">
            <el-input
              class="textarea"
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
            <el-button size="small" type="default" plain @click="send"> 发送({{ sendShortcut }}) </el-button>
          </div>
        </div>
      </template>
    </ContentLayout>
  </div>
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
    flex-direction: column;
    gap: 1rem;
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
  gap: 0.5rem;
  .chat-input-header {
    flex-shrink: 0;
    display: flex;
    gap: 0.5rem;
  }
  .chat-input {
    .textarea {
      --el-input-border-color: transparent;
      --el-input-hover-border-color: transparent;
      --el-input-focus-border-color: transparent;
      --el-input-bg-color: transparent;
    }
    flex: 1;
    overflow: hidden;
    display: flex;
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
