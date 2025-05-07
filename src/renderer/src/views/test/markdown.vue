<script lang="ts" setup>
import Markdown from "@renderer/components/Markdown2/index.vue"
import md from "./markdown.md?raw"
import { useIntervalFn } from "@vueuse/core"
const index = ref(0)
const partial = ref(false)
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
const { pause, resume, isActive } = useIntervalFn(append, 50)
function appendAuto() {
  if (isActive.value) {
    pause()
  } else {
    resume()
  }
}
pause()
</script>
<template>
  <el-row class="w-full h-full overflow-hidden">
    <el-col :span="12" class="h-60vh overflow-hidden">
      <div class="flex w-full h-full">
        <ContentLayout>
          <Markdown :content="content" :partial="partial" id="markdown" />
        </ContentLayout>
      </div>
    </el-col>
    <el-col :span="12" class="h-60vh overflow-hidden">
      <div class="flex gap-1rem">
        <el-button class="append" @click="append">append</el-button>
        <el-button class="append" @click="appendAuto">自动</el-button>
      </div>
    </el-col>
  </el-row>
</template>
<style lang="scss" scoped></style>
