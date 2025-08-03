<script lang="ts" setup>
import { usePartialData, parseResponse } from "@renderer/lib/provider/compatible/utils"
import { useDebounceFn } from "@vueuse/core"

const leftStyle = ref<CSSProperties>({
  width: "40%",
})
const tabs = reactive({
  current: "llm",
})
const rawInputRef = useTemplateRef("rawInput")
const useLLM = () => {
  const partial = usePartialData()
  const stream = ref(true)
  const raw = ref("")
  const parsed = ref("")

  const parse = useDebounceFn((val: string) => {
    partial.reset()
    const res = parseResponse(val, stream.value)
    partial.add(res)
    parsed.value = JSON.stringify(partial.getResponse())
  })
  watch(raw, parse)
  return {
    stream,
    raw,
    parsed,
  }
}
const { raw, parsed, stream } = useLLM()
</script>
<template>
  <el-tabs v-model="tabs.current" type="border-card" class="db-tabs wh-full" tab-position="left">
    <el-tab-pane label="llm" name="llm">
      <DialogPanel class="wh-full">
        <template #header>
          <el-form>
            <el-form-item label="stream">
              <el-switch v-model="stream" />
            </el-form-item>
          </el-form>
        </template>
        <div class="wh-full flex-y-center gap-5px overflow-hidden">
          <div class="h-full flex-shrink-0 relative" ref="rawInput" :style="leftStyle">
            <el-input class="db-input" v-model="raw" resize="none" type="textarea"></el-input>
          </div>
          <div class="relative flex-shrink-0 w-6px h-full">
            <Resize size="4px" direction="r" v-model="leftStyle" :target="rawInputRef"></Resize>
          </div>
          <MonacoEditor
            namespace="debugger"
            class="flex-1 overflow-auto"
            filename="llm-resolved.json"
            auto-format
            lang="json"
            :value="parsed"></MonacoEditor>
        </div>
      </DialogPanel>
    </el-tab-pane>
  </el-tabs>
</template>
<style lang="scss">
.db-tabs {
  .el-tab-pane {
    width: 100%;
    height: 100%;
    min-height: 100%;
  }
  .db-input.el-textarea {
    --el-input-border-color: var(--el-border-color);
    --el-input-hover-border-color: var(--el-border-color);
    --el-input-focus-border-color: var(--el-border-color);
    width: 100%;
    height: 100%;
    .el-textarea__inner {
      height: 100%;
    }
  }
}
</style>
