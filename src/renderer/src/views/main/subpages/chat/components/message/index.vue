<script setup lang="ts">
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import Handler from "./handler/index.vue"
import useChatStore from "@renderer/store/chat"
import TextContent from "./textContent/index.vue"
import RightPanel from "./rightPanel/index.vue"
import { ChatMessage, ChatTopicTree } from "@renderer/types"
import { useMsgContext } from "../../index"
const props = defineProps<{
  topic?: ChatTopicTree
  context: ReturnType<typeof useMsgContext>
}>()
const chatStore = useChatStore()
const contentLayout = useTemplateRef<InstanceType<typeof ContentLayout>>("contentLayout")
const { showRightPanel, toggleRightPanel } = props.context

const topic = computed(() => props.topic?.node)
const message = ref<ChatMessage>()
watch(
  topic,
  val => {
    if (!val) return
    window.setTimeout(handler.onToBottom)
    const m = chatStore.utils.findChatMessageByTopic(val)
    message.value = m
  },
  { immediate: true }
)

const handler = {
  onToBottom: () => {
    setTimeout(() => {
      contentLayout.value?.scrollToBottom("instant")
    }, 0)
  },
  onHandlerHeightChange: (height: number) => {
    if (topic.value) {
      topic.value.inputHeight = height
      chatStore.api.updateChatTopic(topic.value)
    }
  },
}
</script>
<template>
  <div v-if="topic" class="flex flex-1 overflow-hidden">
    <ContentLayout
      :handler-height="topic.inputHeight"
      @update:handler-height="handler.onHandlerHeightChange"
      ref="contentLayout"
      chat-mode>
      <template #header>
        <el-card class="chat-header" shadow="never">
          <div class="flex justify-between">
            <div class="flex items-center gap1rem">
              <slot name="leftHandler"></slot>
            </div>
            <div class="flex items-center gap1rem">
              <ContentBox @click="_ => toggleRightPanel()" background>
                <i-material-symbols:left-panel-close-outline
                  v-if="!showRightPanel"></i-material-symbols:left-panel-close-outline>
                <i-material-symbols:right-panel-close-outline v-else></i-material-symbols:right-panel-close-outline>
              </ContentBox>
            </div>
          </div>
        </el-card>
      </template>
      <TextContent :topic :message :context />
      <template v-if="message" #handler>
        <Handler :topic :message @message-send="handler.onToBottom" @context-clean="handler.onToBottom"></Handler>
      </template>
    </ContentLayout>
    <RightPanel v-show="showRightPanel" :context :topic></RightPanel>
  </div>
  <div v-else class="flex flex-1 items-center justify-center">
    <el-empty />
  </div>
</template>
<style lang="scss" scoped>
.chat-header {
  --el-card-border-color: transparent;
  --el-card-border-radius: 0;
  --el-card-padding: 0.5rem;
  width: 100%;
}
</style>
