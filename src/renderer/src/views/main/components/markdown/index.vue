<script setup lang="ts">
import markdownit from "markdown-it"
import { full as emoji } from "markdown-it-emoji"
import markdownitAnchor from "markdown-it-anchor"
import markdownItCode from "./plugins/code"
import MarkdownIt from "markdown-it"
const props = defineProps<{
  content: string
}>()
const md: MarkdownIt = markRaw(markdownit())
md.use(emoji)
md.use(markdownitAnchor)
md.use(markdownItCode)
const html = ref("")
const parse = async () => {
  // html.value = DOMPurify.sanitize(
  html.value = md.render(props.content, {
    html: true,
    linkify: true,
    typographer: true,
  })
}
watch(() => props.content, parse, { immediate: true })
</script>
<template>
  <div class="line-height-2.5rem" v-html="html"></div>
</template>

<!-- <script setup lang="ts">
import markdownit from "markdown-it"
import { full as emoji } from "markdown-it-emoji"
import markdownitAnchor from "markdown-it-anchor"
import markdownItCode from "./plugins/code"
import MarkdownIt from "markdown-it"
import CodeBlock from "./plugins/code/codeBlock.vue"
import { App } from "vue"
const props = defineProps<{
  content: string
}>()
const md: MarkdownIt = markRaw(markdownit())
const dynamicApps = shallowRef<App<Element>[]>([])
md.use(emoji)
md.use(markdownitAnchor)
md.use(markdownItCode, (elId: string, code: string, content: string, lang: string) => {
  const app = createApp({
    render() {
      return h(CodeBlock, { code, content: content, lang })
    },
  })
  dynamicApps.value.push(app)
  app.mount(`#${elId}`)
})
const html = ref("")
const parse = async () => {
  // html.value = DOMPurify.sanitize(
  html.value = md.render(props.content, {
    html: true,
    linkify: true,
    typographer: true,
  })
}
watch(() => props.content, parse, { immediate: true })
onUnmounted(() => {
  dynamicApps.value.forEach(app => {
    app.unmount()
  })
})
</script>
<template>
  <div class="line-height-2.5rem" v-html="html"></div>
</template> -->
