import MarkdownIt from "markdown-it"
import { cloneVNode, render, VNode } from "vue"
import { UseEventBusReturn } from "@vueuse/core"
export type CodePluginOptions = {
  mdId: string
  idx: number
  elId: string
  vnode: VNode
  code?: string
  lang?: string
}
export type ProvideMsg = { code: string; lang: string }
export type CodePluginProvideKey = UseEventBusReturn<ProvideMsg, any>

const vnodeToHtml = (vnode: VNode): string => {
  const container = document.createElement("div")
  render(vnode, container)
  return container.innerHTML
}
export default (
  md: MarkdownIt,
  mdId: string,
  opt: Record<string, CodePluginOptions>,
  compMap: Record<string, VNode>
) => {
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx]
    const content = token.content
    const lang = token.info
    const comp = compMap[lang] ?? compMap.default
    if (!opt[idx]) {
      const elId = "id-" + uniqueId()
      const vnode = cloneVNode(comp, { code: content, lang, partial: true })
      opt[idx] = { mdId, idx, elId, vnode, code: content, lang }
      const html = vnodeToHtml(vnode)
      return `<div id='${elId}'>${html}</div>`
    } else {
      opt[idx].vnode = cloneVNode(opt[idx].vnode, { code: content, lang, partial: true })
      opt[idx].code = content
      opt[idx].lang = lang
      const html = vnodeToHtml(opt[idx].vnode)
      return `<div id='${opt[idx].elId}'>${html}</div>`
    }
  }
}
