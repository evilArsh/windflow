<script setup lang="ts">
import { ChatMessageTree, ChatTopic } from "@renderer/types/chat"
import { CallBackFn, code1xx, errorToText, isString, msg } from "@toolmain/shared"
import { Affix } from "@toolmain/components"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/components/Markdown/index.vue"
import Handler from "./handler.vue"
import Title from "./title.vue"
import Thinking from "./thinking.vue"
import MCPCall from "./mcpcall.vue"
import Image from "./image.vue"
import Error from "./error.vue"
import useChatStore from "@renderer/store/chat"
import { Role } from "@renderer/types"
import { useMsgContext } from "../../../../index"
const props = defineProps<{
  message: ChatMessageTree
  parent?: ChatMessageTree
  topic: ChatTopic
  header?: boolean
  context: ReturnType<typeof useMsgContext>
}>()

const affixRef = useTemplateRef("affix")

const chatStore = useChatStore()

const topic = computed(() => props.topic)
const message = computed(() => props.message)

const id = useId()
const isUser = computed(() => message.value.node.content.role === Role.User)
const isText = computed(() => !message.value.node.type || message.value.node.type === "text")
const isImage = computed(() => message.value.node.type === "image")
const isPartial = computed(() => code1xx(message.value.node.status) || message.value.node.status == 206)

const md = useTemplateRef("md")
const mdRefs = shallowRef<InstanceType<typeof Markdown>[]>([])
async function onContentChange() {
  chatStore.updateChatMessage(props.message.node)
}
async function onContentDelete(m: ChatMessageTree, done: CallBackFn) {
  try {
    await chatStore.deleteMessage(topic.value, m)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  } finally {
    done()
  }
}
async function onEdit() {
  md.value?.toggleEdit()
  mdRefs.value?.forEach(md => md.toggleEdit())
}
const updateAffix = () => {
  nextTick(() => affixRef.value?.update())
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
  <MsgBubble class="chat-item-container" :class="{ reverse: isUser }" :reverse="isUser" :id>
    <template v-if="header" #header>
      <Affix ref="affix" :offset="88" :target="`#${id}`">
        <Title :message>
          <Handler :topic :parent :message @delete="done => onContentDelete(message, done)" @edit="onEdit"> </Handler>
        </Title>
      </Affix>
    </template>
    <div v-if="isUser" class="chat-item-content p-1rem reverse">
      <Markdown
        v-if="isString(message.node.content.content)"
        v-model="message.node.content.content"
        content-class="flex flex-col items-end"
        ref="md"
        @change="onContentChange"
        editable></Markdown>
    </div>
    <div v-else class="chat-item-content p-1rem">
      <Image v-if="isImage" :message :parent></Image>
      <div v-else-if="isText" class="chat-item-content">
        <div v-for="(child, index) in message.node.content.children" :key="index" class="chat-item-content">
          <Thinking :message="child" :finish="!!message.node.finish"></Thinking>
          <Markdown
            v-if="isString(child.content)"
            :ref="ref => (mdRefs[index] = ref as InstanceType<typeof Markdown>)"
            editable
            v-model="child.content"
            @change="onContentChange" />
          <MCPCall :message="child"></MCPCall>
        </div>
        <Error :message></Error>
      </div>
      <i-svg-spinners-pulse-3 v-if="isPartial" class="text-1.4rem m3px"></i-svg-spinners-pulse-3>
    </div>
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
  flex-direction: column;
  font-size: 1.4rem;
  flex-direction: column;
  gap: var(--ai-gap-base);
  &.reverse {
    justify-content: flex-end;
  }
}
</style>
