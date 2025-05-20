<script lang="ts" setup>
import Markdown from "@renderer/components/Markdown/index.vue"
import md from "./markdown.md?raw"
import { useIntervalFn } from "@vueuse/core"
const index = ref(0)
const content = ref("")
function append() {
  const len = Math.floor(Math.random() * 20) + 1
  if (index.value >= md.length) {
    return
  }
  content.value += md.slice(index.value, index.value + len)
  index.value += len
}
function full() {
  content.value = md
  index.value = md.length
}
function clear() {
  content.value = ""
  index.value = 0
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
    <el-col :span="20" class="h-full overflow-hidden">
      <div class="flex w-full h-full border-solid border-1px border-gray">
        <ContentLayout>
          <Markdown :content="content" />
        </ContentLayout>
      </div>
    </el-col>
    <el-col :span="4" class="h-full overflow-hidden">
      <div class="flex flex-col gap-1rem">
        <el-button class="append" @click="clear">清空</el-button>
        <el-button class="append" @click="full">完整</el-button>
        <el-button class="append" @click="append">append</el-button>
        <el-button class="append" @click="appendAuto">自动</el-button>
      </div>
    </el-col>
  </el-row>
</template>
<style lang="scss" scoped></style>
