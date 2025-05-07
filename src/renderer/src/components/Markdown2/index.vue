<script setup lang="ts">
import { CodePluginOptions } from "./worker/types"
import useParser from "./worker"
import CodeBlock from "./components/codeBlock.vue"
import MermaidBlock from "./components/mermaidBlock.vue"
import { LLMContent } from "@renderer/types"
const props = defineProps<{
  id: string
  partial?: boolean
  content: LLMContent
}>()

const idxMap = shallowReactive<Record<string, CodePluginOptions>>({})
const compMap = shallowReactive<Record<string, VNode>>({
  mermaid: h(MermaidBlock),
  default: h(CodeBlock),
})
const { html, partialHtml, parse } = useParser(props.id, idxMap, compMap)
function handleContent(partial: boolean, content: LLMContent) {
  if (!content) return
  if (!isString(content)) return
  parse(content, partial)
}
watch(
  () => props.partial,
  val => handleContent(val, props.content),
  { immediate: true }
)
watch(
  () => props.content,
  val => handleContent(props.partial, val),
  { immediate: true }
)
</script>
<template>
  <div class="markdown-container">
    <div v-for="(htmlStr, index) in html" :key="index" v-html="htmlStr"></div>
    <div v-html="partialHtml"></div>
  </div>
</template>
<style lang="scss">
@use "./index.scss";
</style>
