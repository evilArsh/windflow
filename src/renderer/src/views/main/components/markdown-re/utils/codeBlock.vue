<script setup lang="ts">
import { useClipboard } from "@vueuse/core"
import "highlight.js/styles/github-dark.css"
const props = defineProps<{
  code?: string
  lang?: string
  html?: string
}>()
const { copy } = useClipboard({ source: props.code })
const copied = ref(false)
async function onCopy() {
  try {
    if (copied.value) return
    await copy()
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (_) {
    copied.value = false
  }
}
</script>
<template>
  <div>
    <el-card class="code-block" shadow="never">
      <template #header>
        <div class="code-block-header">
          <el-tag type="primary">{{ lang || "plaintext" }}</el-tag>
          <el-button type="primary" @click="onCopy" size="small" round plain circle>
            <i-ic:outline-check v-if="copied"></i-ic:outline-check>
            <i-ic:baseline-content-copy v-else></i-ic:baseline-content-copy>
          </el-button>
        </div>
      </template>
      <div v-html="html"></div>
    </el-card>
  </div>
</template>

<style>
pre {
  counter-reset: line;
}
.code-line::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 2em;
  margin-right: 1em;
  color: #666;
  text-align: right;
  user-select: none;
}
.code-block {
  --el-card-padding: 1rem;
  border: solid 1px #dce0e5;
  border-radius: 0.5rem;
}
.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.code-block-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
