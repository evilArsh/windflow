<script setup lang="ts">
import mermaid from "mermaid"
import useParser from "./worker"
import CodeBlock from "./components/CodeBlock/index.vue"
import { Content } from "@renderer/types"
const props = defineProps<{
  content: Content
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
const { html, parse, destroy, init } = useParser({
  code: CodeBlock,
})
function handleContent(content: Content) {
  if (!isString(content)) return
  if (!content) {
    html.value = h("span", "")
    return
  }
  parse(content)
}
watch(() => props.content, handleContent)
onMounted(() => {
  init()
  handleContent(props.content)
})
onBeforeUnmount(destroy)
</script>
<template>
  <div class="markdown-container">
    <component :is="html"></component>
  </div>
</template>
<style lang="scss">
@use "./index.scss";
</style>
