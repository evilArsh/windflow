<script setup lang="ts">
import markdownit from "markdown-it"
import { full as emoji } from "markdown-it-emoji"
import markdownitAnchor from "markdown-it-anchor"
import mathjax3 from "markdown-it-mathjax3"
import markdownItCode from "./plugins"
import MarkdownIt from "markdown-it"
import { CodePluginOptions } from "./plugins"
import { LLMChatMessage } from "@renderer/types"
import { render, cloneVNode, VNode } from "vue"
import mermaid from "mermaid"
import MermaidBlock from "./plugins/mermaidBlock.vue"
import CodeBlock from "./plugins/codeBlock.vue"
const props = defineProps<{
  id: string
  /**
   * @description 如果markdown内容是分段返回的，并且还未返回完成，则需要设置为true。
   * 表示当前content还在不断返回
   */
  partial?: boolean
  /**
   * @description TODO: 数据是增量数据，不是独立分片。
   */
  content: LLMChatMessage
}>()
const md: MarkdownIt = markRaw(
  markdownit({
    html: true,
    linkify: true,
    typographer: true,
  }).disable(["hr"])
)
const idxMap = shallowReactive<Record<string, CodePluginOptions>>({})
const compMap = shallowReactive<Record<string, VNode>>({
  mermaid: h(MermaidBlock),
  default: h(CodeBlock),
})
md.use(emoji)
md.use(markdownitAnchor)
md.use(markdownItCode, props.id, idxMap, compMap)
md.use(mathjax3, {
  tex: {
    tags: "ams",
  },
  options: {
    skipHtml: false,
  },
})
mermaid.initialize({
  startOnLoad: true,
  securityLevel: "loose",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  theme: "default",
})
const html = ref("")
const withPartialFirst = ref(false)
/**
 * @description 分片渲染时，vnode只取innerHTML,内部功能失效
 * 所有内容加载完毕后render完整的vnode
 */
const parse = (val: LLMChatMessage) => {
  if (props.partial) {
    html.value = md.render(val.content)
  } else {
    // 完整数据第一次渲染，搜集所有code块
    if (!withPartialFirst.value) {
      html.value = md.render(val.content)
    }
    nextTick(() => {
      Object.values(idxMap).forEach(item => {
        const el = document.getElementById(item.elId)
        if (el) {
          el.innerHTML = ""
          item.vnode = cloneVNode(item.vnode, { partial: false, code: item.code, lang: item.lang })
          render(item.vnode, el)
        }
      })
    })
  }
}
watch(
  [() => props.content, () => props.partial],
  () => {
    parse(props.content)
  },
  { deep: true }
)
onMounted(() => {
  withPartialFirst.value = props.partial
  parse(props.content)
})
</script>
<template>
  <div style="line-height: 1.5" v-html="html"></div>
</template>
