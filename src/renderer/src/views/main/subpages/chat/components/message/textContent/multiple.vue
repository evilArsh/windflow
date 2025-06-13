<script setup lang="ts">
import { ChatMessage, ChatMessageData, ChatTopic } from "@renderer/types/chat"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Single from "./single.vue"
import Handler from "./handler.vue"
import useChatStore from "@renderer/store/chat"
import LeftToRight from "~icons/ic/baseline-align-vertical-top"
import TopToBottom from "~icons/ic/baseline-align-horizontal-left"
import Tab from "~icons/ic/outline-folder-copy"
import { CSSProperties } from "@renderer/lib/shared/types"
const props = defineProps<{
  message: ChatMessage
  messageItem: ChatMessageData
  topic: ChatTopic
}>()
const id = useId()
const chatStore = useChatStore()
const message = computed(() => props.message)
const messageItem = computed(() => props.messageItem)
const order = shallowReactive({
  type: "l2r",
  columnNums: 2,
  typeList: [
    { label: h(LeftToRight), value: "l2r" },
    { label: h(TopToBottom), value: "t2b" },
    { label: h(Tab), value: "tab" },
  ],
  containerStyle: computed<CSSProperties>(() => {
    switch (order.type) {
      case "l2r":
        return {
          flex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${order.columnNums}, 1fr)`,
          gridTemplateRows: "auto",
          gap: "1rem",
          flexDirection: "row",
        }
      case "t2b":
        return {
          flex: 1,
          display: "flex",
          gap: "1rem",
          flexDirection: "column",
        }
      case "tab":
        return {}
    }
    return {}
  }),
})
async function del() {
  if (!isArray(messageItem.value.children)) return
  messageItem.value.children
    .map(item => item.id)
    .forEach(childId => {
      chatStore.deleteSubMessage(props.topic, childId, messageItem.value.id)
    })
  chatStore.api.updateChatMessage(props.message)
}
</script>
<template>
  <MsgBubble :id>
    <template #header>
      <div class="flex items-center px-1rem py-.5rem">
        <Handler hide-edit :topic :message :message-item @delete="del"></Handler>
        <el-divider direction="vertical" border-style="dashed" />
        <el-slider v-model="order.columnNums" :step="1" show-stops />
        <ContentBox>
          <el-radio-group v-model="order.type" size="small" fill="#6cf">
            <el-radio-button v-for="item in order.typeList" :label="item.value" :key="item.value">
              <component :is="item.label"></component>
            </el-radio-button>
          </el-radio-group>
        </ContentBox>
      </div>
    </template>
    <div class="chat-item-content" :style="order.containerStyle.value">
      <Single
        v-for="item in messageItem.children"
        :parent="messageItem"
        :topic
        :message
        :message-item="item"
        :key="item.id"
        header
        class="flex-1"></Single>
    </div>
  </MsgBubble>
</template>
<style lang="scss" scoped>
.chat-item-content {
  padding: 1rem;
  font-size: 1.4rem;
}
</style>
