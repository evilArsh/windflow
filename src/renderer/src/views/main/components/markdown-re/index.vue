<script setup lang="ts">
import mermaid from "mermaid"
import { normalizeFormula } from "./utils/utils"
import { CodePluginOptions } from "./utils/types"
import CodeBlock from "./utils/codeBlock.vue"
import MermaidBlock from "./utils/mermaidBlock.vue"
import { cloneVNode, h, render, ref, shallowReactive, watch } from "vue"
import { cloneUn, cloneVnodeUn } from "./utils/unified"
const props = defineProps<{
  id: string
  partial?: boolean
  content: string
}>()

const html = ref("")
const withPartialFirst = ref(false)
const activeUn = markRaw(cloneUn())

const idxMap = shallowReactive<Record<string, CodePluginOptions>>({})
const compMap = shallowReactive<Record<string, VNode>>({
  mermaid: h(MermaidBlock),
  default: h(CodeBlock),
})

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
 * @description 分片渲染时，vnode只取innerHTML,内部功能失效
 * 所有内容加载完毕后render完整的vnode
 */
const parse = async (val: string) => {
  // 部分数据渲染||完整数据第一次渲染，搜集所有code块
  if (props.partial) {
    const res = await activeUn.process(normalizeFormula(val))
    html.value = res.value.toString()
  } else {
    // 完整数据第一次渲染，搜集所有code块
    if (!withPartialFirst.value) {
      const res = await cloneVnodeUn(props.id, idxMap, compMap).process(normalizeFormula(val))
      html.value = res.value.toString()
    }
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
watch(
  [() => props.content, () => props.partial],
  ([content, _]) => {
    parse(content)
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
<style>
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
</style>
