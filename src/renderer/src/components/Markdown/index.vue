<script setup lang="ts">
import useParser from "./worker"
import CodeBlock from "./components/CodeBlock/index.vue"
import { Content } from "@renderer/types"
const props = defineProps<{
  content: Content
}>()

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
