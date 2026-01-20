<script setup lang="ts">
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import Handler from "./components/handler/index.vue"
import useChatStore from "@renderer/store/chat"
import Content from "./components/content/index.vue"
import RightPanel from "./components/rightPanel/index.vue"
import { DialogPanel } from "@toolmain/components"
import { ChatTopicTree } from "@windflow/core/types"
import { useMsgContext } from "../../index"
import { isString } from "@toolmain/shared"
const props = defineProps<{
  topic?: ChatTopicTree
  context: ReturnType<typeof useMsgContext>
}>()
const chatStore = useChatStore()
const contentLayout = useTemplateRef<InstanceType<typeof ContentLayout>>("contentLayout")
const { showRightPanel, toggleRightPanel } = props.context.menuToggle
const { props: dlgProps, event: dlgEvent, cachedMessage, onCancel, onConfirm } = props.context.messageDialog
const { t } = useI18n()

const topic = computed(() => props.topic?.node)
watch(
  topic,
  val => {
    if (!val) return
    window.setTimeout(handler.onToBottom)
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
      chatStore.updateChatTopic(topic.value)
    }
  },
}
</script>
<template>
  <div class="message-container">
    <el-dialog v-bind="dlgProps" v-on="dlgEvent" :title="t('chat.editMessage')">
      <DialogPanel class="h-70vh w-full">
        <div class="flex flex-col gap-1rem">
          <el-input
            type="textarea"
            autosize
            v-if="isString(cachedMessage.content.content) && cachedMessage.content.content"
            v-model="cachedMessage.content.content" />
          <div v-for="(child, index) in cachedMessage.content.children" :key="index">
            <el-input
              type="textarea"
              style="
                --el-input-border-color: transparent;
                --el-border-color: transparent;
                --el-input-hover-border-color: transparent;
                --el-input-focus-border-color: transparent;
              "
              autosize
              resize="none"
              v-if="isString(child.content)"
              v-model="child.content" />
          </div>
        </div>
        <template #footer>
          <Button type="primary" @click="onConfirm">{{ t("btn.confirm") }}</Button>
          <Button @click="onCancel">{{ t("btn.cancel") }}</Button>
        </template>
      </DialogPanel>
    </el-dialog>
    <ContentLayout
      :handler-height="toValue(topic?.inputHeight)"
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
                <i-material-symbols-left-panel-close-outline
                  v-if="!showRightPanel"></i-material-symbols-left-panel-close-outline>
                <i-material-symbols-right-panel-close-outline v-else></i-material-symbols-right-panel-close-outline>
              </ContentBox>
            </div>
          </div>
        </el-card>
      </template>
      <template #default>
        <Content v-if="topic" :topic :context></Content>
        <div v-else class="flex flex-1 items-center justify-center">
          <el-empty />
        </div>
      </template>
      <template v-if="topic" #handler>
        <Handler :topic @message-send="handler.onToBottom" @context-clean="handler.onToBottom"></Handler>
      </template>
    </ContentLayout>
    <RightPanel v-show="showRightPanel" :context :topic></RightPanel>
  </div>
</template>
<style lang="scss" scoped>
.message-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: var(--ai-gap-base);
}
.chat-header {
  --el-card-border-color: transparent;
  --el-card-border-radius: 0;
  --el-card-padding: 0.5rem;
  width: 100%;
}
</style>
