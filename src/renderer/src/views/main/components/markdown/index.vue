<script setup lang="ts">
import markdownit from "markdown-it"
import { full as emoji } from "markdown-it-emoji"
import markdownitAnchor from "markdown-it-anchor"
import markdownItCode from "./plugins/code"
import MarkdownIt from "markdown-it"
import { CodePluginOptions } from "./plugins/code"
import { LLMChatResponse } from "@renderer/types"
import { render, cloneVNode } from "vue"
const props = defineProps<{
  id: string
  content: LLMChatResponse
}>()
const md: MarkdownIt = markRaw(markdownit())
const idxMap = shallowReactive<Record<string, CodePluginOptions>>({})
md.use(emoji)
md.use(markdownitAnchor)
md.use(markdownItCode, props.id, idxMap)
const html = ref("")
const parse = (val: LLMChatResponse, oldVal: LLMChatResponse | undefined) => {
  if (val.status == 206) {
    html.value = md.render(val.data.map(item => item.content).join(""), {
      html: true,
      linkify: true,
      typographer: true,
    })
  } else if (val.status == 200) {
    if (!oldVal) {
      html.value = md.render(val.data.map(item => item.content).join(""), {
        html: true,
        linkify: true,
        typographer: true,
      })
    }
    nextTick(() => {
      Object.values(idxMap).forEach(item => {
        const el = document.getElementById(item.elId)
        if (el) {
          el.innerHTML = ""
          item.vnode = cloneVNode(item.vnode, { status: val.status })
          render(item.vnode, el)
        }
      })
    })
  }
}
watch(() => props.content, parse, { immediate: true, deep: true })
</script>
<template>
  <div class="line-height-2.5rem" v-html="html"></div>
</template>
