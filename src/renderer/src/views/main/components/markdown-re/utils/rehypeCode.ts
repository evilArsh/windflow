import { visit } from "unist-util-visit"
import { selectAll } from "hast-util-select"
import { parseSelector } from "hast-util-parse-selector"
import { toString } from "hast-util-to-string"
import { CodePluginOptions } from "./types"
import { cloneVNode } from "vue"
import { getLang } from "./utils"

export const rehypeVueVnode = ({
  mdId,
  idxMap,
  compMap,
}: {
  mdId: string
  idxMap: Record<string, CodePluginOptions>
  compMap: Record<string, VNode>
}) => {
  return tree => {
    const selected = selectAll("pre", tree)
    if (selected.length > 0) {
      visit(tree, selected, (node, index, parent) => {
        if (!isUndefined(index)) {
          const lang = getLang(node)
          const code = toString(node)
          const comp = compMap[lang] ?? compMap.default
          if (!idxMap[index]) {
            const elId = "id-" + uniqueId()
            const vnode = cloneVNode(comp, { code, lang, partial: true }) //FIXME: partial
            idxMap[index] = { mdId, idx: index, elId, vnode, code, lang }
          } else {
            idxMap[index].vnode = cloneVNode(idxMap[index].vnode, { code, lang, partial: true }) //FIXME: partial
            idxMap[index].code = code
            idxMap[index].lang = lang
          }
          const wrap = parseSelector(`div#${idxMap[index].elId}`)
          wrap.children = [node]
          parent.children[index] = wrap
        }
      })
    }
  }
}

export const rehypeHrToBr = () => {
  return tree => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName === "hr") {
        parent.children.splice(index, 1, {
          type: "element",
          tagName: "br",
          properties: {},
          children: [],
        })
      }
    })
  }
}
