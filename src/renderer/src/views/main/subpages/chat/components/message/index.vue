<script setup lang="ts">
import { ChatTopic, ChatMessageData } from "@renderer/types"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/components/Markdown/index.vue"
import useScrollHook from "@renderer/views/main/usable/useScrollHook"
import useShortcut from "@renderer/views/main/usable/useShortcut"
import useModelsStore from "@renderer/store/model.store"
import ModelSelect from "../modelSelect/index.vue"
import useChatStore from "@renderer/store/chat.store"
import { storeToRefs } from "pinia"
import EditMsg from "./editMsg.vue"
import { render } from "vue"
import useProviderStore from "@renderer/store/provider.store"
const { currentTopic, currentMessage } = storeToRefs(useChatStore())

const contentLayout = useTemplateRef<InstanceType<typeof ContentLayout>>("contentLayout")
const modelsStore = useModelsStore()
const chatStore = useChatStore()
const { t } = useI18n()
const { onScroll } = useScrollHook(contentLayout, currentTopic, currentMessage)
const providerStore = useProviderStore()
const send = (topic?: ChatTopic) => {
  if (topic) {
    chatStore.send(topic)
    nextTick(() => {
      contentLayout.value?.scrollToBottom("smooth")
    })
  }
}
const edit = (msg: ChatMessageData) => {
  render(
    h(EditMsg, {
      ts: Date.now(),
      data: msg.content.content,
      title: t("chat.editChat"),
      confirm: t("tip.confirm"),
      cancel: t("tip.cancel"),
      onChange: (data: string) => {
        msg.content.content = data
      },
    }),
    document.body
  )
}
const message = computed(() => currentMessage.value?.data ?? [])
const { sendShortcut } = useShortcut(currentTopic, {
  send,
})
</script>
<template>
  <div v-if="currentTopic" class="flex flex-1 overflow-hidden">
    <ContentLayout v-model:handler-height="currentTopic.node.inputHeight" ref="contentLayout" @scroll="onScroll">
      <template #header>
        <div class="flex p-1rem justify-end flex-1"></div>
      </template>
      <div class="flex flex-col gap2rem flex-1 overflow-hidden">
        <el-text line-clamp="7" class="text-1.2rem" type="info" size="small">{{ currentTopic.node.prompt }}</el-text>
        <MsgBubble v-for="msg in message" :key="msg.id" :reverse="!msg.modelId">
          <template #head>
            <div class="flex flex-col gap1rem">
              <Hover>
                <el-avatar style="--el-avatar-size: 4rem">
                  <Svg
                    :src="
                      providerStore.getProviderLogo(msg.modelId ? modelsStore.find(msg.modelId)?.providerName : 'user')
                    "
                    class="text-3rem"></Svg>
                </el-avatar>
              </Hover>
              <div class="flex flex-col gap0.5rem items-center">
                <el-tooltip v-if="msg.modelId" :content="t('chat.terminate')" placement="right">
                  <Button
                    @click="done => chatStore.terminate(done, currentTopic?.node.id, msg.id)"
                    size="small"
                    :disabled="!(msg.status == 206 || msg.status == 100)"
                    circle
                    plain
                    text
                    type="primary">
                    <i-solar:stop-circle-bold class="text-1.4rem"></i-solar:stop-circle-bold>
                  </Button>
                </el-tooltip>
                <el-tooltip v-if="msg.modelId" :content="t('chat.regenerate')" placement="right">
                  <Button
                    @click="done => chatStore.restart(done, currentTopic?.node, msg.id)"
                    size="small"
                    :disabled="!msg.finish"
                    circle
                    plain
                    text
                    type="primary">
                    <i-solar:refresh-bold class="text-1.4rem"></i-solar:refresh-bold>
                  </Button>
                </el-tooltip>
                <el-tooltip v-if="msg.modelId" :content="t('chat.editChat')" placement="right">
                  <el-button size="small" :disabled="!msg.finish" circle plain text type="primary" @click="edit(msg)">
                    <i-solar:clapperboard-edit-broken class="text-1.4rem"></i-solar:clapperboard-edit-broken>
                  </el-button>
                </el-tooltip>
                <el-popconfirm
                  :title="t('tip.deleteConfirm')"
                  @confirm="chatStore.deleteSubMessage(currentTopic?.node, currentMessage, msg.id)">
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
            </div>
          </template>
          <template #content>
            <div class="chat-item-container">
              <div class="chat-item-header" :class="{ reverse: !msg.modelId }">
                <div v-if="msg.modelId" class="flex items-center gap-0.25rem">
                  <el-text class="name">
                    {{ modelsStore.find(msg.modelId)?.providerName }}
                  </el-text>
                  <el-text type="danger">|</el-text>
                  <el-text type="primary">{{ modelsStore.find(msg.modelId)?.modelName }}</el-text>
                </div>
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
                  <Markdown v-if="msg.modelId" :id="msg.id" :content="msg.content.content" :partial="!msg.finish" />
                  <el-text v-else type="primary" class="self-end!">
                    {{ msg.content.content }}
                  </el-text>
                  <template #footer> </template>
                </el-card>
              </div>
              <div class="chat-item-footer"></div>
            </div>
          </template>
        </MsgBubble>
      </div>
      <template #handler>
        <div class="chat-input-container" ref="scale">
          <div class="chat-input-header">
            <ModelSelect v-model="currentTopic.node.modelIds" />
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
              v-model="currentTopic.node.content"
              :placeholder="t('tip.inputPlaceholder')"></el-input>
          </div>
          <div class="chat-input-actions">
            <el-button size="small" type="default" plain @click="send(currentTopic.node)">
              发送({{ sendShortcut }})
            </el-button>
          </div>
        </div>
      </template>
    </ContentLayout>
  </div>
  <div v-else class="flex flex-1 items-center justify-center">
    <el-empty />
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
