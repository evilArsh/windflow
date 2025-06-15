<script setup lang="ts">
import { ChatMessage, ChatMessageData, ChatTopic } from "@renderer/types/chat"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/components/Markdown/index.vue"
import RawTextEdit from "../rawTextEdit/index.vue"
import Handler from "./handler.vue"
import Title from "./title.vue"
import Loading from "./loading.vue"
import MCPCall from "./mcpcall.vue"
import Affix from "@renderer/components/Affix/index.vue"
import useChatStore from "@renderer/store/chat"
import { Role } from "@renderer/types"

const props = defineProps<{
  message: ChatMessage
  messageItem: ChatMessageData
  parent?: ChatMessageData
  topic: ChatTopic
  header?: boolean
}>()

const affixRef = useTemplateRef("affix")

const chatStore = useChatStore()

const message = computed(() => props.message)
const topic = computed(() => props.topic)

const id = useId()
const rawDlg = useTemplateRef("rawDlg")
const rawTextDlg = reactive({
  data: undefined as ChatMessageData | undefined,
  onChange: markRaw((value: string) => {
    if (rawTextDlg.data) {
      rawTextDlg.data.content.content = value
      chatStore.api.updateChatMessage(message.value)
    }
  }),
  edit: markRaw((msg: ChatMessageData) => {
    rawTextDlg.data = msg
    rawDlg.value?.open()
  }),
  del: markRaw((msg: ChatMessageData) => {
    if (message.value) {
      chatStore.deleteSubMessage(topic.value, msg.id, props.parent?.id)
      chatStore.api.updateChatMessage(message.value)
    }
  }),
})
const isAssistant = computed(() => props.messageItem.content.role === Role.Assistant)
const isPartial = computed(() => {
  return props.messageItem.status < 200 || props.messageItem.status == 206
})
defineExpose({
  update: () => affixRef.value?.update(),
})
</script>
<template>
  <MsgBubble class="chat-item-container" :class="{ reverse: !isAssistant }" :reverse="!isAssistant" :id>
    <template v-if="header" #header>
      <Affix ref="affix" :offset="42" :target="`#${id}`">
        <Title :message-item>
          <Handler
            :topic
            :parent
            :message-item
            @delete="rawTextDlg.del(messageItem)"
            @edit="rawTextDlg.edit(messageItem)"></Handler>
        </Title>
      </Affix>
    </template>
    <div class="chat-item-content" :class="{ reverse: !isAssistant }">
      <Loading v-if="isAssistant" :message-item></Loading>
      <MCPCall v-if="isAssistant" :message-item :topic></MCPCall>
      <Markdown v-if="isAssistant" :content="messageItem.content.content" />
      <i-svg-spinners:pulse-3 v-if="isAssistant && isPartial" class="text-1.4rem m3px"></i-svg-spinners:pulse-3>
      <el-text v-if="!isAssistant" type="primary" class="self-end!">
        {{ messageItem.content.content }}
      </el-text>
    </div>
    <RawTextEdit ref="rawDlg" @change="rawTextDlg.onChange" :data="rawTextDlg.data?.content.content"></RawTextEdit>
  </MsgBubble>
</template>
<style lang="scss" scoped>
.chat-item-container {
  &.reverse {
    align-self: flex-end;
  }
}
.chat-item-content {
  flex: 1;
  display: flex;
  font-size: 1.4rem;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  &.reverse {
    justify-content: flex-end;
  }
}
</style>
