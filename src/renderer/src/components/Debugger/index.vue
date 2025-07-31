<script lang="ts" setup>
const leftStyle = ref<CSSProperties>({})
const tabs = reactive({
  current: "llm",
})
const llm = shallowReactive({
  raw: "",
  parsed: "",
  onRawInput() {
    // llm.parsed = JSON.parse(llm.raw)
  },
})
</script>
<template>
  <el-tabs v-model="tabs.current" tab-position="left">
    <el-tab-pane label="llm" name="llm">
      <DialogPanel>
        <el-space>
          <div :style="leftStyle">
            <el-input v-model="llm.raw" type="textarea" @change="llm.onRawInput"></el-input>
          </div>
          <Resize size="4px" direction="r" v-model="leftStyle"></Resize>
          <MonacoEditor namespace="debugger" filename="llm-resolved" lang="json" :value="llm.parsed"></MonacoEditor>
        </el-space>
      </DialogPanel>
    </el-tab-pane>
  </el-tabs>
</template>
<style lang="scss" scoped></style>
