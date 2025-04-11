<script setup lang="ts">
import mermaid from "mermaid"
import { normalizeFormula } from "./utils/utils"
import { CodePluginOptions } from "./utils/types"
import CodeBlock from "./components/codeBlock.vue"
import MermaidBlock from "./components/mermaidBlock.vue"
import { cloneVNode, h, render, ref, shallowReactive, watch } from "vue"
import { cloneUn, cloneVnodeUn } from "./utils/unified"
const props = defineProps<{
  id: string
  partial?: boolean
  content: string
}>()

const html = ref("")

const idxMap = shallowReactive<Record<string, CodePluginOptions>>({})
const compMap = shallowReactive<Record<string, VNode>>({
  mermaid: h(MermaidBlock),
  default: h(CodeBlock),
})

const activeUn = markRaw(cloneUn())
const vnodeUn = markRaw(cloneVnodeUn(props.id, idxMap, compMap))

mermaid.initialize({
  startOnLoad: true,
  securityLevel: "loose",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  fontFamily: "Maple Mono CN",
  theme: "default",
})
/**
 * @description 所有内容加载完毕后render完整的vnode
 */
const parse = async (content: string, partial: boolean) => {
  // 部分数据渲染
  if (partial) {
    html.value = (await activeUn.process(content)).value.toString()
  } else {
    html.value = (await vnodeUn.process(content)).value.toString()
    await nextTick()
    Object.values(idxMap).forEach(item => {
      const el = document.getElementById(item.elId)
      if (el) {
        item.vnode = cloneVNode(item.vnode, {
          rootId: item.elId,
          code: item.code,
          html: el.innerHTML,
          lang: item.lang,
        })
        el.innerHTML = ""
        render(item.vnode, el)
      }
    })
    mermaid.run()
  }
}
const handleContent = (content: string, partial: boolean) => {
  content = normalizeFormula(content)
  if (partial) {
    parse(content, partial)
  } else {
    Object.keys(idxMap).forEach(key => {
      delete idxMap[key]
    })
    parse(content, partial)
  }
}
watch(
  [() => props.content, () => props.partial],
  ([content, partial]) => {
    handleContent(content, partial)
  },
  { deep: true }
)
onMounted(() => {
  handleContent(props.content, props.partial)
})
</script>

<template>
  <div class="markdown-container" v-html="html"></div>
</template>
<style lang="scss">
pre {
  counter-reset: line;
}
.code-line::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 2em;
  margin-right: 1em;
  color: #666;
  text-align: right;
  user-select: none;
}
.code-block {
  --el-card-padding: 1rem;
  border: solid 1px #dce0e5;
  border-radius: 0.5rem;
}
.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.code-block-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mermaid-container {
  display: block !important;
  max-width: 100%;
  overflow: auto;
}
.markdown-container {
  line-height: 1.5;
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }

  table th,
  table td {
    border: 1px solid #ddd;
    padding: 8px;
  }

  table th {
    background-color: #f2f2f2;
    text-align: left;
  }
}
</style>
