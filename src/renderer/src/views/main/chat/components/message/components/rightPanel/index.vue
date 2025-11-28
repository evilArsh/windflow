<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import { CSSProperties, px } from "@toolmain/shared"
import { Resize } from "@toolmain/components"
import Prompt from "./prompt.vue"
import { useMsgContext } from "../../../../index"
const props = defineProps<{
  topic?: ChatTopic
  context: ReturnType<typeof useMsgContext>
}>()
const emit = defineEmits<{
  resizeChange: []
}>()
const { emitToggle } = props.context
const { t } = useI18n()
const resizeStyle = ref<CSSProperties>({
  width: px(300),
})
const tab = ref("knowledge")
</script>
<template>
  <div :style="resizeStyle" class="right-panel">
    <Resize
      v-model="resizeStyle"
      @scaling="emitToggle"
      @after-scale="emit('resizeChange')"
      size="8px"
      direction="left" />
    <div v-if="topic" class="flex flex-col flex-1 gap-1rem">
      <Prompt :topic></Prompt>
      <el-tabs class="chat-config-tabs" v-model="tab">
        <el-tab-pane :label="t('chat.right.history')" name="history"> </el-tab-pane>
      </el-tabs>
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
.chat-config-tabs {
  flex: 1;
  :deep(.el-tabs__content) {
    display: flex;
  }
  :deep(.el-tab-pane) {
    overflow: hidden;
    flex: 1;
    display: flex;
  }
}
</style>
