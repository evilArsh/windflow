<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core"
import mermaid from "mermaid"
const props = defineProps<{
  code: string
  lang: string
}>()
const codeRef = useTemplateRef("code")
watch(
  [() => props.code, () => props.lang],
  useDebounceFn(
    async () => {
      await nextTick()
      if (!codeRef.value) return
      codeRef.value.removeAttribute("data-processed")
      mermaid
        .run({
          nodes: [codeRef.value],
          suppressErrors: false,
        })
        .catch(() => {
          if (codeRef.value) {
            codeRef.value.innerText = props.code
          }
        })
    },
    300,
    { maxWait: 1200 }
  ),
  { immediate: true }
)
</script>
<template>
  <div class="markdown-mermaid-container">
    <pre class="language-mermaid"><code ref="code" v-text="code"></code></pre>
  </div>
</template>
<style lang="scss">
.markdown-mermaid-container {
  display: block !important;
  max-width: 100%;
  overflow: auto;
}
</style>
