<script setup lang="ts">
import { ChatMessage, ChatTopic } from "@renderer/types/chat"
import Single from "./single.vue"
import Multiple from "./multiple.vue"
import Divider from "./divider.vue"
import { useMsgContext } from "../../../index"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"
const chatStore = useChatStore()
const { chatMessage } = storeToRefs(chatStore)

const props = defineProps<{
  topic: ChatTopic
  context: ReturnType<typeof useMsgContext>
}>()
const messages = computed<ChatMessage[] | undefined>(() => chatMessage.value[props.topic.id])
</script>
<template>
  <div v-if="messages" class="flex flex-col-reverse p-1.5rem gap2.5rem">
    <el-divider style="--el-border-color: transparent" class="my-0.25rem!"></el-divider>
    <div v-for="message in messages" :key="message.id">
      <Divider v-if="message.contextFlag" :topic :message></Divider>
      <Multiple v-else-if="message.children && message.children.length" :topic :context :message></Multiple>
      <Single v-else :topic :message :context header></Single>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
