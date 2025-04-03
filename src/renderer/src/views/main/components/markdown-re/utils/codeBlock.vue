<script setup lang="ts">
import { useClipboard } from "@vueuse/core"
import hljs from "highlight.js"
import DOMPurify from "dompurify"
import "highlight.js/styles/github-dark.css"
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
const hilight = (code?: string, lang?: string) => {
  let content = ""
  if (lang && hljs.getLanguage(lang)) {
    try {
      content = hljs.highlight(code ?? "", { language: lang, ignoreIllegals: true }).value
    } catch (_) {
      content = DOMPurify.sanitize(code ?? "")
    }
  } else {
    content = DOMPurify.sanitize(code ?? "")
  }
  return content
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
      <pre>
        <code :class="`hljs language-${lang}`" v-html="hilight(code, lang)"></code>
      </pre>
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
</style>
