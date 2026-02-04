<script setup lang="ts">
import { ChatMessageContextFlag, ChatMessageTree, ChatTopic, SettingKeys } from "@windflow/core/types"
import useSettingsStore from "@renderer/store/settings"
import Single from "./single.vue"
import Multiple from "./multiple.vue"
import Divider from "./divider.vue"
import { useMsgContext } from "../../../../index"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"
const chatStore = useChatStore()
const { chatMessage } = storeToRefs(chatStore)
const settingsStore = useSettingsStore()

const props = defineProps<{
  topic: ChatTopic
  context: ReturnType<typeof useMsgContext>
}>()
const messages = computed<ChatMessageTree[] | undefined>(() => chatMessage.value[props.topic.id])
const { data: width } = settingsStore.dataBind<string>(SettingKeys.ChatPanelWidth)
</script>
<template>
  <div
    v-if="messages"
    :style="{ width }"
    class="flex flex-col-reverse p[var(--ai-gap-medium)] self-center gap[var(--ai-gap-extre-large)]">
    <div v-for="message in messages" class="flex flex-col" :key="message.id">
      <Divider v-if="message.node.contextFlag === ChatMessageContextFlag.BOUNDARY" :topic :message></Divider>
      <Multiple v-else-if="message.children?.length" :topic :context :message></Multiple>
      <Single v-else :topic :message :context header></Single>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
