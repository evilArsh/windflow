<script setup lang="ts">
import markdownit from "markdown-it"
import { full as emoji } from "markdown-it-emoji"
import markdownitAnchor from "markdown-it-anchor"
import hljs from "highlight.js"
import "highlight.js/styles/github.css"
import MarkdownIt from "markdown-it"
// import DOMPurify from "dompurify"
const props = defineProps<{
  content: string
}>()
const md: MarkdownIt = markRaw(
  markdownit({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return (
            '<pre><code class="hljs">' +
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
            "</code></pre>"
          )
        } catch (_) {
          return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + "</code></pre>"
        }
      }
      return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + "</code></pre>"
    },
  })
)
md.use(emoji)
md.use(markdownitAnchor)
const html = ref("")
const parse = async () => {
  // html.value = DOMPurify.sanitize(
  html.value = md.render(props.content, {
    // html: true,
    linkify: true,
    typographer: true,
  })
}

watch(() => props.content, parse, { immediate: true })
</script>
<template>
  <div class="line-height-2.5rem" v-html="html"></div>
</template>
