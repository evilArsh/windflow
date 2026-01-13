<script setup lang="ts">
import { VNode } from "vue"
import CodeBlock from "./components/CodeBlock/index.vue"
import { useMarkdownWorker, useMermaid, useVueRuntime, MDWorkerMessageCore } from "@windflow/markdown"
const props = defineProps<{
  contentClass?: string
  content: string
  /**
   * force render string to plaintext
   */
  forcePlaintext?: boolean
}>()
const html = shallowRef<VNode>()
const id = useId()
const mermaid = useMermaid()
const mdWorker = useMarkdownWorker()
const rt = useVueRuntime({
  components: {
    code: CodeBlock,
  },
})
function onParseContent(content: string) {
  if (!content || /^\n+$/.test(content)) {
    html.value = h("span", "")
    return
  }
  mdWorker.emit(id, { type: "Parse", markdown: content })
}
function onParseResponse(event: MDWorkerMessageCore) {
  if (event.type === "ParseResponse") {
    html.value = rt.toVnode(event.node)
  }
}
watch(() => props.content, onParseContent)
onMounted(() => {
  mermaid.init()
  onParseContent(props.content)
  mdWorker.on(id, onParseResponse)
})
onBeforeUnmount(() => {
  mdWorker.emit(id, { type: "Dispose" })
  rt.dispose()
})
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
