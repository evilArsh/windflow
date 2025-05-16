<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import { CSSProperties } from "@renderer/lib/shared/types"
import MCP from "./components/mcp.vue"
import Prompt from "./components/prompt.vue"
const props = defineProps<{
  modelValue: ChatTopic
}>()
const emit = defineEmits<{
  resizeChange: []
  "update:modelValue": [ChatTopic]
}>()
const data = computed<ChatTopic>({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val),
})
const rightNavRef = useTemplateRef("rightNav")
const resizeStyle = ref<CSSProperties>({
  width: px(300),
})
const tabs = reactive({
  active: "mcp",
})
</script>
<template>
  <div ref="rightNav" :style="resizeStyle" class="right-panel">
    <Resize v-model="resizeStyle" @after-scale="emit('resizeChange')" size="8px" direction="l" :target="rightNavRef" />
    <div class="flex flex-col flex-1">
      <Prompt v-model="data"></Prompt>
      <el-divider class="my1.5rem!"></el-divider>
      <el-tabs class="flex-1 overflow-hidden" type="border-card" v-model="tabs.active">
        <el-tab-pane class="max-h-100% overflow-hidden flex" label="mcp" name="mcp">
          <MCP v-model="data"></MCP>
        </el-tab-pane>
      </el-tabs>
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
