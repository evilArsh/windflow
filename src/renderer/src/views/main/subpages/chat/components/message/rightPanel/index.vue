<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import { CSSProperties } from "@renderer/lib/shared/types"
import Prompt from "./components/prompt.vue"
import { useMsgContext } from "../../../index"
const props = defineProps<{
  topic: ChatTopic
  context: ReturnType<typeof useMsgContext>
}>()
const emit = defineEmits<{
  resizeChange: []
}>()
const { emitToggle } = props.context
const topic = computed<ChatTopic>(() => props.topic)
// const { t } = useI18n()
const rightNavRef = useTemplateRef("rightNav")
const resizeStyle = ref<CSSProperties>({
  width: px(300),
})
</script>
<template>
  <div ref="rightNav" :style="resizeStyle" class="right-panel">
    <Resize
      v-model="resizeStyle"
      @scaling="emitToggle"
      @after-scale="emit('resizeChange')"
      size="8px"
      direction="l"
      :target="rightNavRef" />
    <div class="flex flex-col flex-1">
      <Prompt :topic></Prompt>
      <el-divider class="my1.5rem!"></el-divider>
      <DialogPanel> </DialogPanel>
    </div>
  </div>
</template>
<style lang="scss" scoped>
html.dark {
  .right-panel {
    --right-panel-bg-color: #141414;
    --right-panel-border-color: #000;
  }
}
.right-panel {
  --right-panel-border-color: #d9d9d9;
  --right-panel-bg-color: #fff;

  background-color: var(--right-panel-bg-color);
  border-left: solid 1px var(--right-panel-border-color);
  display: flex;
  padding: 1rem;
  position: relative;
  min-width: 20rem;
  z-index: 999;
}
</style>
