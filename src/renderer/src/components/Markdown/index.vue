<script setup lang="ts">
import { ParseConfig, useParser } from "./libs"
import CodeBlock from "./components/CodeBlock/index.vue"
const props = defineProps<{
  contentClass?: string
  content: string
  /**
   * parse config
   */
  config?: ParseConfig
}>()
const { html, parse, destroy, init } = useParser({
  code: CodeBlock,
})
function handleContent(content: string) {
  if (!content) {
    html.value = h("span", "")
    return
  }
  parse(content, props.config)
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
    <div class="w-full" :class="[contentClass]">
      <component :is="html"></component>
    </div>
  </div>
</template>
<style lang="scss">
@use "./index.scss";
</style>
