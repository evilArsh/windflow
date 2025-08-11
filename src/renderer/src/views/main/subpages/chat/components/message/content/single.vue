<script setup lang="ts">
import { ChatMessage, ChatTopic } from "@renderer/types/chat"
import { errorToText } from "@shared/utils"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/components/Markdown/index.vue"
import Handler from "./handler.vue"
import Title from "./title.vue"
import Thinking from "./thinking.vue"
import MCPCall from "./mcpcall.vue"
import Image from "./image.vue"
import Error from "./error.vue"
import Affix from "@renderer/components/Affix/index.vue"
import useChatStore from "@renderer/store/chat"
import { Role } from "@renderer/types"
import { useMsgContext } from "../../../index"
import { code1xx } from "@shared/types/bridge"
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
const isUser = computed(() => message.value.content.role === Role.User)
const isText = computed(() => !message.value.type || message.value.type === "text")
const isImage = computed(() => message.value.type === "image")
const isPartial = computed(() => code1xx(message.value.status) || message.value.status == 206)
async function onContentChange() {
  chatStore.api.putChatMessage(props.parent ?? props.message)
}
async function onContentDelete(m: ChatMessage) {
  try {
    await chatStore.deleteMessage(topic.value, m.id, props.parent?.id)
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  }
}
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
  <MsgBubble class="chat-item-container" :class="{ reverse: isUser }" :reverse="isUser" :id>
    <template v-if="header" #header>
      <Affix ref="affix" :offset="88" :target="`#${id}`">
        <Title :message>
          <Handler :topic :parent :message @delete="onContentDelete(message)"></Handler>
        </Title>
      </Affix>
    </template>
    <div v-if="isUser" class="chat-item-content p-1rem reverse">
      <el-text type="primary" class="self-end!">
        {{ message.content.content }}
      </el-text>
    </div>
    <div v-else class="chat-item-content p-1rem">
      <Image v-if="isImage" :message :parent></Image>
      <div v-else-if="isText" class="chat-item-content">
        <div v-for="(child, index) in message.content.children" :key="index" class="chat-item-content">
          <Thinking :message="child" :finish="!!message.finish"></Thinking>
          <MCPCall :message="child"></MCPCall>
          <Markdown v-if="isString(child.content)" editable v-model="child.content" @change="onContentChange" />
        </div>
        <Error :message></Error>
      </div>
      <i-svg-spinners:pulse-3 v-if="isPartial" class="text-1.4rem m3px"></i-svg-spinners:pulse-3>
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
