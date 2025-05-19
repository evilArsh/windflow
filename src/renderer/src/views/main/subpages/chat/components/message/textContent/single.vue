<script setup lang="ts">
import { ChatMessageData } from "@renderer/types/chat"
import MsgBubble from "@renderer/components/MsgBubble/index.vue"
import Markdown from "@renderer/components/Markdown/index.vue"
import RawTextEdit from "../rawTextEdit/index.vue"
import Handler from "./handler.vue"
import Title from "./title.vue"
import Loading from "./loading.vue"
import MCPCall from "./mcpcall.vue"
import { useThrottleFn } from "@vueuse/core"
const props = defineProps<{
  data: ChatMessageData
  header?: boolean
}>()
const id = useId()
const affixRef = useTemplateRef("affix")
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
const updateAffix = useThrottleFn(
  () => {
    // affixRef.value?.updateRoot()
    affixRef.value?.update()
  },
  200,
  true
)
watch(
  () => props.data.content,
  () => {
    nextTick(updateAffix)
  },
  { deep: true, immediate: true }
)
</script>
<template>
  <MsgBubble class="chat-item-container" :class="{ reverse: !isAssistant }" :reverse="!isAssistant" :id>
    <template v-if="header" #header>
      <el-affix ref="affix" :offset="40" :target="`#${id}`">
        <Title :data>
          <Handler :data @edit="rawTextDlg.edit(data)"></Handler>
        </Title>
      </el-affix>
    </template>
    <div class="chat-item-content" :class="{ reverse: !isAssistant }">
      <Loading v-if="isAssistant" :data></Loading>
      <MCPCall v-if="isAssistant" :data></MCPCall>
      <Markdown v-if="isAssistant" :content="data.content.content" @update="updateAffix" />
      <i-svg-spinners:pulse-3 v-if="isAssistant && isPartial" class="text-1.4rem m3px"></i-svg-spinners:pulse-3>
      <el-text v-if="!isAssistant" type="primary" class="self-end!">
        {{ data.content.content }}
      </el-text>
    </div>
    <RawTextEdit ref="rawDlg" @change="rawTextDlg.onChange" :data="rawTextDlg.data?.content.content"></RawTextEdit>
  </MsgBubble>
</template>
<style lang="scss" scoped>
html.dark {
  .chat-item-container {
    --affix-shadow-color: transparent;
    :deep(.el-affix--fixed) {
      --affix-shadow-color: rgba(255, 255, 255, 0.15);
    }
  }
}
.chat-item-container {
  --affix-shadow-color: transparent;
  :deep(.el-affix--fixed) {
    --affix-shadow-color: rgba(0, 0, 0, 0.1);
  }
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
