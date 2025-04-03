<script setup lang="ts">
import "highlight.js/styles/github-dark.css"
import mermaid from "mermaid"
import { useClipboard } from "@vueuse/core"
const props = defineProps<{
  code?: string
  lang?: string
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
async function renderMermaid() {
  await nextTick()
  mermaid.run()
}
watchEffect(() => {
  renderMermaid()
})
</script>
<template>
  <div>
    <el-card class="code-block" shadow="never">
      <template #header>
        <div class="code-block-header">
          <el-tag type="primary">{{ lang }}</el-tag>
          <el-button type="primary" @click="onCopy" size="small" round plain circle>
            <i-ic:outline-check v-if="copied"></i-ic:outline-check>
            <i-ic:baseline-content-copy v-else></i-ic:baseline-content-copy>
          </el-button>
        </div>
      </template>
      <div class="mermaid-container">
        <pre class="mermaid" v-html="code"></pre>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
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
.mermaid-container {
  display: block !important;
  max-width: 100%;
  overflow: auto;
}
</style>
