# @windflow/markdown

mardown parser for vue, support worker thread, and transfer to vue's vnode

## usage

this package includes worker thread and non worker thread versions.

### generally usage

```ts
import { useParser, useVueRuntime } from "@windflow/markdown"
import { VNode } from "vue"

const mdStr: string = `
# title
## markdown

this is a markdown string
`
const parser = useParser()
const rt = useVueRuntime()
// this a hast node
const node = await parser.parse(mdStr)
// trans hast to vue's vnode, you can use this vnode like following:
// <component :is="vnode" ></component>
const vnode: VNode = rt.toVnode(node)
```

## worker thread usage

register vue plugin

```ts
import { createMarkdownWorker } from "@windflow/markdown"
const app = createApp(App)
app.use(createMarkdownWorker())
```

example

```vue
<script setup lang="ts">
import { VNode } from "vue"
import { useMarkdownWorker, useMermaid, useVueRuntime, MDWorkerMessageCore } from "@windflow/markdown"
const props = defineProps<{
  content: string
}>()
const html = shallowRef<VNode>()
const id = useId()
const mermaid = useMermaid()
const mdWorker = useMarkdownWorker()
const rt = useVueRuntime()
function onParseContent(content: string) {
  if (!content) {
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
  <component :is="html"></component>
</template>
```
