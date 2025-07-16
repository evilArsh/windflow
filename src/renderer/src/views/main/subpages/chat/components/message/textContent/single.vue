<script setup lang="ts">
import { ChatMessage, ChatTopic } from "@renderer/types/chat"
import { errorToText } from "@shared/error"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/components/Markdown/index.vue"
import RawTextEdit from "./rawTextEdit.vue"
import Handler from "./handler.vue"
import Title from "./title.vue"
import Loading from "./loading.vue"
import MCPCall from "./mcpcall.vue"
import Affix from "@renderer/components/Affix/index.vue"
import useChatStore from "@renderer/store/chat"
import { Role } from "@renderer/types"
import { useMsgContext } from "../../../index"
const props = defineProps<{
  message: ChatMessage
  parent?: ChatMessage
  topic: ChatTopic
  header?: boolean
  context: ReturnType<typeof useMsgContext>
}>()

const affixRef = useTemplateRef("affix")

const chatStore = useChatStore()

const topic = computed(() => props.topic)
const message = computed(() => props.message)

const id = useId()
const rawDlg = useTemplateRef("rawDlg")
const rawTextDlg = reactive({
  data: undefined as ChatMessage | undefined,
  onChange: markRaw((value: string) => {
    if (rawTextDlg.data) {
      rawTextDlg.data.content.content = value
      chatStore.api.updateChatMessage(rawTextDlg.data)
    }
  }),
  edit: markRaw((msg: ChatMessage) => {
    rawTextDlg.data = msg
    rawDlg.value?.open()
  }),
  del: markRaw(async (m: ChatMessage) => {
    try {
      await chatStore.deleteMessage(topic.value, m.id, props.parent?.id)
    } catch (error) {
      msg({ code: 500, msg: errorToText(error) })
    }
  }),
})
const isAssistant = computed(() => props.message.content.role === Role.Assistant)
const isPartial = computed(() => {
  return props.message.status < 200 || props.message.status == 206
})
const updateAffix = () => {
  nextTick(affixRef.value?.update)
}
onMounted(() => {
  props.context.watchToggle(updateAffix)
})
onBeforeUnmount(() => {
  props.context.unWatchToggle(updateAffix)
})
defineExpose({
  update: updateAffix,
})
</script>
<template>
  <MsgBubble class="chat-item-container" :class="{ reverse: !isAssistant }" :reverse="!isAssistant" :id>
    <template v-if="header" #header>
      <Affix ref="affix" :offset="42" :target="`#${id}`">
        <Title :message>
          <Handler :topic :parent :message @delete="rawTextDlg.del(message)" @edit="rawTextDlg.edit(message)"></Handler>
        </Title>
      </Affix>
    </template>
    <div class="chat-item-content" :class="{ reverse: !isAssistant }">
      <Loading v-if="isAssistant" :message></Loading>
      <MCPCall v-if="isAssistant" :message :topic></MCPCall>
      <Markdown v-if="isAssistant" :content="message.content.content" />
      <i-svg-spinners:pulse-3 v-if="isAssistant && isPartial" class="text-1.4rem m3px"></i-svg-spinners:pulse-3>
      <el-text v-if="!isAssistant" type="primary" class="self-end!">
        {{ message.content.content }}
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
