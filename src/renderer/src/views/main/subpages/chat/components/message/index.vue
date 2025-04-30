<script setup lang="ts">
import { ChatTopic } from "@renderer/types"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import useScrollHook from "@renderer/views/main/usable/useScrollHook"
import useShortcut from "@renderer/views/main/usable/useShortcut"
import ModelSelect from "../modelSelect/index.vue"
import TextInput from "./textInput/index.vue"
import useChatStore from "@renderer/store/chat.store"
import TextContent from "./textContent/index.vue"
import RightPanel from "./rightPanel/index.vue"
import { storeToRefs } from "pinia"
const { currentTopic, currentMessage } = storeToRefs(useChatStore())
const contentLayout = useTemplateRef<InstanceType<typeof ContentLayout>>("contentLayout")
const chatStore = useChatStore()
const { t } = useI18n()
const { onScroll } = useScrollHook(contentLayout, currentTopic, currentMessage)
const send = (topic?: ChatTopic) => {
  if (topic) {
    chatStore.send(topic)
    nextTick(() => {
      contentLayout.value?.scrollToBottom("smooth")
    })
  }
}
const onRightResizeChange = () => {
  contentLayout.value?.updateScroll()
}
const message = computed(() => currentMessage.value?.data ?? [])
const { sendShortcut } = useShortcut(currentTopic, {
  send,
})
</script>
<template>
  <div v-if="currentTopic" class="flex flex-1 overflow-hidden">
    <ContentLayout v-model:handler-height="currentTopic.node.inputHeight" ref="contentLayout" @scroll="onScroll">
      <template #header> </template>
      <div class="flex flex-col gap2rem flex-1 overflow-hidden">
        <TextContent v-for="data in message" :key="data.id" :data="data" />
      </div>
      <template #handler>
        <div class="chat-input-container" ref="scale">
          <div class="chat-input-header">
            <ModelSelect v-model="currentTopic.node" />
          </div>
          <TextInput v-model="currentTopic.node.content" />
          <div class="chat-input-actions">
            <el-button size="small" type="default" plain @click="send(currentTopic.node)">
              {{ t("btn.send") }}({{ sendShortcut }})
            </el-button>
          </div>
        </div>
      </template>
    </ContentLayout>
    <RightPanel v-model="currentTopic.node" @resize-change="onRightResizeChange"></RightPanel>
  </div>
  <div v-else class="flex flex-1 items-center justify-center">
    <el-empty />
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
