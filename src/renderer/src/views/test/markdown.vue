<script lang="ts" setup>
import Markdown from "@renderer/components/Markdown/index.vue"
import md from "./markdown.md?raw"
const index = ref(0)
const partial = ref(true)
const content = ref("")
function append() {
  const len = Math.floor(Math.random() * 20) + 1
  if (index.value >= md.length) {
    partial.value = false
    return
  }
  content.value += md.slice(index.value, index.value + len)
  index.value += len
  partial.value = true
}
</script>
<template>
  <el-row class="w-full h-full overflow-hidden">
    <el-col :span="12" class="h-full overflow-hidden">
      <el-scrollbar view-class="p2rem">
        <Markdown :content="content" :partial="partial" id="markdown" />
      </el-scrollbar>
    </el-col>
    <el-col :span="12" class="h-full overflow-hidden">
      <div class="flex gap-1rem">
        <el-button class="append" @click="append">append</el-button>
      </div>
    </el-col>
  </el-row>
</template>
<style lang="scss" scoped></style>
