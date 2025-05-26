<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/components/Markdown/index.vue"
import RawTextEdit from "../rawTextEdit/index.vue"
import Handler from "./handler.vue"
import Title from "./title.vue"
import Loading from "./loading.vue"
import MCPCall from "./mcpcall.vue"
import Affix from "@renderer/components/Affix/index.vue"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"

const props = defineProps<{
  data: ChatMessageData
  header?: boolean
}>()

const chatStore = useChatStore()
const { currentMessage } = storeToRefs(chatStore)

const id = useId()
const rawDlg = useTemplateRef("rawDlg")
const elObserver = shallowRef<IntersectionObserver>()
const rawTextDlg = reactive({
  data: undefined as ChatMessageData | undefined,
  onChange: markRaw((value: string) => {
    if (rawTextDlg.data) {
      rawTextDlg.data.content.content = value
      currentMessage.value && chatStore.api.updateChatMessage(currentMessage.value)
    }
  }),
  edit: markRaw((msg: ChatMessageData) => {
    rawTextDlg.data = msg
    rawDlg.value?.open()
  }),
})
const isAssistant = computed(() => !!props.data.modelId)
const isPartial = computed(() => {
  return props.data.status < 200 || props.data.status == 206
})
onBeforeUnmount(() => {
  elObserver.value?.disconnect()
})
</script>
<template>
  <MsgBubble class="chat-item-container" :class="{ reverse: !isAssistant }" :reverse="!isAssistant" :id>
    <template v-if="header" #header>
      <Affix :offset="40" :target="`#${id}`">
        <Title :data>
          <Handler :data @edit="rawTextDlg.edit(data)"></Handler>
        </Title>
      </Affix>
    </template>
    <div class="chat-item-content" :class="{ reverse: !isAssistant }">
      <Loading v-if="isAssistant" :data></Loading>
      <MCPCall v-if="isAssistant" :data></MCPCall>
      <Markdown v-if="isAssistant" :content="data.content.content" />
      <i-svg-spinners:pulse-3 v-if="isAssistant && isPartial" class="text-1.4rem m3px"></i-svg-spinners:pulse-3>
      <el-text v-if="!isAssistant" type="primary" class="self-end!">
        {{ data.content.content }}
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
