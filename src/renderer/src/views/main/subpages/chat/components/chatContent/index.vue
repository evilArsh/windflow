<script setup lang="ts">
import ds from "@renderer/assets/images/provider/deepseek.svg"
import { ChatMessage, ChatTopic } from "@renderer/types"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/views/main/components/markdown/index.vue"
import useScrollHook from "../../usable/useScrollHook"
import useShortcut from "../../usable/useShortcut"
import useModelsStore from "@renderer/store/model.store"
import ModelTool from "../model/index.vue"
import useSync from "../../usable/useSync"
import useChatStore from "@renderer/store/chat.store"
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
const modelsStore = useModelsStore()
const chatStore = useChatStore()
const { t } = useI18n()

const { message } = useSync(topic)
const { onScroll } = useScrollHook(contentLayout, topic, message)
const send = (topic: ChatTopic, message: ChatMessage) => {
  chatStore.send(topic, message)
  nextTick(() => {
    contentLayout.value?.scrollToBottom("smooth")
  })
}
const { sendShortcut } = useShortcut(topic, message, {
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
        <div class="w-4rem flex-shrink-0 flex flex-col items-center py-1rem"></div>
        <div class="flex flex-col gap2rem flex-1">
          <MsgBubble v-for="(msg, msgIndex) in message.data" :key="msg.id" :reverse="!msg.modelId">
            <template #head>
              <Hover>
                <el-avatar :src="ds" size="default" />
              </Hover>
            </template>
            <template #content>
              <div class="chat-item-container">
                <div class="chat-item-header" :class="{ reverse: !msg.modelId }">
                  <el-text class="name">{{ modelsStore.find(msg.modelId)?.providerName }}</el-text>
                  <el-text class="time">{{ msg.time }}</el-text>
                </div>
                <div class="chat-item-content" :class="{ reverse: !msg.modelId }">
                  <el-card style="--el-card-padding: 1rem" shadow="never">
                    <template #header v-if="msg.modelId">
                      <div class="flex flex-col gap-0.5rem">
                        <div>
                          <el-button v-show="msg.status == 100 && msg.reasoning" type="primary" loading size="small">
                            {{ t("chat.thinking") }}
                          </el-button>
                        </div>
                        <div>
                          <el-text v-show="msg.content.reasoningContent" type="success" class="self-start!">
                            {{ msg.content.reasoningContent }}
                          </el-text>
                        </div>
                        <div>
                          <el-text v-show="msg.status == 100" type="primary" size="small">
                            <i-eos-icons:three-dots-loading class="text-4rem"></i-eos-icons:three-dots-loading>
                          </el-text>
                        </div>
                      </div>
                    </template>
                    <Markdown v-if="msg.modelId" :id="msg.id" :content="msg.content" :partial="!msg.finish" />
                    <el-text v-else type="primary" class="self-end!">
                      {{ msg.content.content }}
                    </el-text>
                    <template #footer>
                      <div>
                        <el-tooltip v-if="msg.modelId" :content="t('chat.terminate')" placement="top">
                          <Button
                            @click="done => chatStore.terminate(done, topic.id, msg.modelId)"
                            size="small"
                            :disabled="!(msg.status == 206 || msg.status == 100)"
                            circle
                            plain
                            text
                            type="primary">
                            <i-solar:stop-circle-bold class="text-1.4rem"></i-solar:stop-circle-bold>
                          </Button>
                        </el-tooltip>
                        <el-tooltip v-if="msg.modelId" :content="t('chat.regenerate')" placement="top">
                          <Button
                            @click="done => chatStore.restart(done, topic, message, msg)"
                            size="small"
                            :disabled="!msg.finish"
                            circle
                            plain
                            text
                            type="primary">
                            <i-solar:refresh-bold class="text-1.4rem"></i-solar:refresh-bold>
                          </Button>
                        </el-tooltip>
                        <el-tooltip v-if="msg.modelId" :content="t('chat.editChat')" placement="top">
                          <el-button size="small" :disabled="!msg.finish" circle plain text type="primary">
                            <i-solar:clapperboard-edit-broken class="text-1.4rem"></i-solar:clapperboard-edit-broken>
                          </el-button>
                        </el-tooltip>
                        <el-popconfirm
                          :title="t('tip.deleteConfirm')"
                          @confirm="chatStore.deleteSubMessage(message, msgIndex)">
                          <template #reference>
                            <el-button size="small" :disabled="!msg.finish" circle plain text type="danger">
                              <i-solar:trash-bin-trash-outline class="text-1.4rem"></i-solar:trash-bin-trash-outline>
                            </el-button>
                          </template>
                          <template #actions="{ confirm, cancel }">
                            <div class="flex justify-between">
                              <el-button type="danger" size="small" @click="confirm">{{ t("tip.yes") }}</el-button>
                              <el-button size="small" @click="cancel">{{ t("tip.cancel") }}</el-button>
                            </div>
                          </template>
                        </el-popconfirm>
                      </div>
                    </template>
                  </el-card>
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
            <el-button size="small" type="default" plain @click="send(topic, message)">
              发送({{ sendShortcut }})
            </el-button>
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
