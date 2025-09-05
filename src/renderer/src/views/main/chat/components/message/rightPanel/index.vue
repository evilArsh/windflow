<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import { CSSProperties, px } from "@toolmain/shared"
import { DialogPanel } from "@toolmain/components"
import { Resize } from "@toolmain/components"
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
const resizeStyle = ref<CSSProperties>({
  width: px(300),
})
</script>
<template>
  <div :style="resizeStyle" class="right-panel">
    <Resize
      v-model="resizeStyle"
      @scaling="emitToggle"
      @after-scale="emit('resizeChange')"
      size="8px"
      direction="left" />
    <div class="flex flex-col flex-1">
      <Prompt :topic></Prompt>
      <el-divider class="my1.5rem!"></el-divider>
      <DialogPanel> </DialogPanel>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.right-panel {
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-bg-color);
  display: flex;
  padding: 1rem;
  position: relative;
  min-width: 20rem;
  z-index: 100;
}
</style>
