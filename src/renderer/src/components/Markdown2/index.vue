<script setup lang="ts">
import useParser from "./worker"
// import CodeBlock from "./components/codeBlock.vue"
// import MermaidBlock from "./components/mermaidBlock.vue"
import { LLMContent } from "@renderer/types"
const props = defineProps<{
  content: LLMContent
}>()

const { html, parse } = useParser()
function handleContent(content: LLMContent) {
  if (!content) return
  if (!isString(content)) return
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
