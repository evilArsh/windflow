<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/components/Markdown/index.vue"
import RawTextEdit from "../rawTextEdit/index.vue"
import Handler from "./handler.vue"
import Title from "./title.vue"
import Loading from "./loading.vue"
import MCPCall from "./mcpcall.vue"
const props = defineProps<{
  data: ChatMessageData
}>()
const id = useId()
const rawDlg = useTemplateRef("rawDlg")
const rawTextDlg = reactive({
  data: undefined as ChatMessageData | undefined,
  onChange: markRaw((value: string) => {
    if (rawTextDlg.data) {
      rawTextDlg.data.content.content = value
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
</script>
<template>
  <MsgBubble :reverse="!isAssistant" :id>
    <template #head>
      <el-affix :offset="40" :target="`#${id}`">
        <Handler :data @edit="rawTextDlg.edit(data)"></Handler>
      </el-affix>
    </template>
    <template #content>
      <div class="chat-item-container">
        <el-affix :offset="40" :target="`#${id}`">
          <Title :data></Title>
        </el-affix>
        <div class="chat-item-content" :class="{ reverse: !isAssistant }">
          <el-card style="--el-card-padding: 1rem" shadow="never">
            <Loading v-if="isAssistant" :data></Loading>
            <MCPCall v-if="isAssistant" :data></MCPCall>
            <Markdown v-if="isAssistant" :content="data.content.content" />
            <i-svg-spinners:pulse-3 v-if="isAssistant && isPartial" class="text-1.4rem m3px"></i-svg-spinners:pulse-3>
            <el-text v-if="!isAssistant" type="primary" class="self-end!">
              {{ data.content.content }}
            </el-text>
          </el-card>
        </div>
        <div class="chat-item-footer"></div>
      </div>
      <RawTextEdit ref="rawDlg" @change="rawTextDlg.onChange" :data="rawTextDlg.data?.content.content"></RawTextEdit>
    </template>
  </MsgBubble>
</template>
<style lang="scss" scoped>
.chat-item-container {
  --chat-item-content-bg-color: transparent;
  --chat-item-container-bg-color: transparent;
  --chat-item-footer-bg-color: transparent;

  background-color: var(--chat-item-container-bg-color);
  overflow: hidden;
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .chat-item-content {
    flex: 1;
    display: flex;
    background-color: var(--chat-item-content-bg-color);
    font-size: 1.4rem;
    flex-direction: column;
    gap: 1rem;
    &.reverse {
      justify-content: flex-end;
    }
  }
  .chat-item-footer {
    flex-shrink: 0;
    display: flex;
    background-color: var(--chat-item-footer-bg-color);
  }
}
</style>
