<script setup lang="ts">
import mermaid from "mermaid"
import useParser from "./worker"
import CodeBlock from "./components/CodeBlock/index.vue"
import { LLMContent } from "@renderer/types"
const emit = defineEmits<{
  /**
   * 内容动态更新和首次渲染完成时触发
   */
  (e: "update"): void
}>()
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
    html.value = ""
  }
  parse(content)
}
watch(
  () => props.content,
  val => handleContent(val),
  { immediate: true }
)
onUpdated(() => {
  emit("update")
})
onMounted(async () => {
  await nextTick()
  emit("update")
})
</script>
<template>
  <div class="markdown-container">
    <component :is="html"></component>
  </div>
</template>
<style lang="scss">
@use "./index.scss";
</style>
