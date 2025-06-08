<script setup lang="ts">
import mermaid from "mermaid"
import useParser from "./worker"
import CodeBlock from "./components/CodeBlock/index.vue"
import { LLMContent } from "@renderer/types"
const props = defineProps<{
  content: LLMContent
}>()

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  fontFamily: "Maple Mono CN",
  theme: "default",
})
const { html, parse } = useParser({
  code: CodeBlock,
})
function handleContent(content: LLMContent) {
  if (!isString(content)) return
  if (!content) {
    html.value = h("span", "")
  }
  parse(content)
}
watch(
  () => props.content,
  val => handleContent(val),
  { immediate: true }
)
</script>
<template>
  <div class="markdown-container">
    <component :is="html"></component>
  </div>
</template>
<style lang="scss">
@use "./index.scss";
</style>
