import MarkdownIt from "markdown-it"
import { cloneVNode, render, VNode } from "vue"
import CodeBlock from "./codeBlock.vue"
import { UseEventBusReturn } from "@vueuse/core"

export type CodePluginOptions = {
  mdId: string
  idx: number
  elId: string
  vnode: VNode
  code?: string
  status?: number
}
export type ProvideMsg = { code: string; lang: string }
export type CodePluginProvideKey = UseEventBusReturn<ProvideMsg, any>

const vnodeToHtml = (vnode: VNode): string => {
  const container = document.createElement("div")
  render(vnode, container)
  return container.innerHTML
}
export default (md: MarkdownIt, mdId: string, opt: Record<string, CodePluginOptions>) => {
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx]
    const content = token.content
    const lang = token.info
    if (!opt[idx]) {
      const elId = "id-" + uniqueId()
      const vnode = h(CodeBlock, { code: content, lang, status: 206 })
      opt[idx] = { mdId, idx, elId, vnode, code: content }
      const html = vnodeToHtml(vnode)
      return `<div id='${elId}'>${html}</div>`
    } else {
      opt[idx].vnode = cloneVNode(opt[idx].vnode, { code: content, lang, status: 206 })
      opt[idx].code = content
      const html = vnodeToHtml(opt[idx].vnode)
      return `<div id='${opt[idx].elId}'>${html}</div>`
    }
  }
}
