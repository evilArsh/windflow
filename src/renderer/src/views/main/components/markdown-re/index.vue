<script setup lang="ts">
import { LLMChatMessage } from "@renderer/types"
import mermaid from "mermaid"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import remarkEmoji from "remark-emoji"
import remarkSqueezeParagraphs from "remark-squeeze-paragraphs"
import remarkRehype from "remark-rehype"
// import remarkStringify from "remark-stringify"
// import remarkMdx from "remark-mdx"
import rehypeMathjax from "rehype-mathjax"
import rehypeStringify from "rehype-stringify"
import rehypeHighlight from "rehype-highlight"
import rehypeHighlightCodeLines from "rehype-highlight-code-lines"
import { normalizeFormula } from "./utils/utils"
import { rehypeVueVnode, rehypeHrToBr } from "./utils/rehypeCode"
import { CodePluginOptions } from "./utils/types"
import CodeBlock from "./utils/codeBlock.vue"
import MermaidBlock from "./utils/mermaidBlock.vue"
import { cloneVNode, h, render, ref, shallowReactive, watch } from "vue"
const props = defineProps<{
  id: string
  partial?: boolean
  content: LLMChatMessage
}>()

const html = ref("")
const withPartialFirst = ref(false)

const idxMap = shallowReactive<Record<string, CodePluginOptions>>({})
const compMap = shallowReactive<Record<string, VNode>>({
  mermaid: h(MermaidBlock),
  default: h(CodeBlock),
})
const un = unified()
  .data("settings", {
    allowDangerousHtml: true,
    allowDangerousCharacters: true,
  })
  .use(remarkParse)
  .use(remarkMath, { singleDollarTextMath: true })
  .use(remarkSqueezeParagraphs)
  .use(remarkGfm)
  .use(remarkEmoji)
  .use(remarkRehype, { allowDangerousHtml: true, format: "html" })
  .use(rehypeMathjax)
  .use(rehypeVueVnode, { mdId: props.id, idxMap, compMap })
  .use(rehypeHighlight)
  .use(rehypeHighlightCodeLines, {
    showLineNumbers: true,
  })
  .use(rehypeHrToBr)
  .use(rehypeStringify)

mermaid.initialize({
  startOnLoad: true,
  securityLevel: "loose",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  theme: "default",
})
/**
 * @description 分片渲染时，vnode只取innerHTML,内部功能失效
 * 所有内容加载完毕后render完整的vnode
 */
const parse = async (val: LLMChatMessage) => {
  // 部分数据渲染||完整数据第一次渲染，搜集所有code块
  if (props.partial) {
    const res = await un.process(normalizeFormula(val.content))
    html.value = res.value.toString()
  } else {
    // 完整数据第一次渲染，搜集所有code块
    if (!withPartialFirst.value) {
      const res = await un.process(normalizeFormula(val.content))
      html.value = res.value.toString()
    }
    nextTick(() => {
      Object.values(idxMap).forEach(item => {
        const el = document.getElementById(item.elId)
        if (el) {
          item.vnode = cloneVNode(item.vnode, {
            partial: false,
            code: item.code,
            html: el.innerHTML,
            lang: item.lang,
          })
          el.innerHTML = ""
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
