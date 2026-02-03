<script setup lang="ts">
import { VNode } from "vue"
import CodeBlock from "./components/CodeBlock/index.vue"
import {
  useMarkdownWorker,
  useMermaid,
  useVueRuntime,
  MDWorkerMessageCore,
  wrapAsCode,
  Components,
} from "@windflow/markdown"
const emit = defineEmits<{
  updated: []
}>()
const props = defineProps<{
  contentClass?: string
  content: string
  /**
   * force render string to plaintext code block
   */
  forcePlaintext?: boolean
}>()
const html = shallowRef<VNode>()
const id = useId()
const mermaid = useMermaid()
const mdWorker = useMarkdownWorker()
const config = computed<Components>(() => {
  return {
    code: {
      extraProps: {
        forcePlaintext: props.forcePlaintext,
      },
      node: markRaw(CodeBlock),
    },
  }
})
const rt = useVueRuntime()
function preprocessContent(content: string) {
  return props.forcePlaintext ? wrapAsCode(content, "plaintext") : content
}
function onParseContent(content: string) {
  if (!content || /^\n+$/.test(content)) {
    html.value = h("span", "")
    return
  }
  mdWorker.emit(id, {
    type: "Parse",
    markdown: preprocessContent(content),
  })
}
function onParseResponse(event: MDWorkerMessageCore) {
  if (event.type === "ParseResponse") {
    html.value = rt.toVnode(event.node, config.value)
  }
}
watch(() => props.content, onParseContent)
watch(
  () => props.forcePlaintext,
  () => {
    nextTick(() => {
      onParseContent(props.content)
    })
  }
)
onMounted(() => {
  mermaid.init()
  onParseContent(props.content)
  mdWorker.on(id, onParseResponse)
})
onUpdated(() => {
  emit("updated")
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
