import { visit } from "unist-util-visit"
import { selectAll } from "hast-util-select"
import { parseSelector } from "hast-util-parse-selector"
import { toString } from "hast-util-to-string"
import { CodePluginOptions } from "./types"
import { cloneVNode } from "vue"
import { getLang } from "./utils"
import { isElement } from "hast-util-is-element"
import { hasProperty } from "hast-util-has-property"

const newVNode = (
  mdId: string,
  elId: string,
  idxMap: Record<string, CodePluginOptions>,
  compMap: Record<string, VNode>,
  node: any,
  parent: any
) => {
  const codeNode = node.children.find(child => isElement(child, "code"))
  const code = codeNode ? toString(codeNode) : ""
  const lang = getLang(node)
  const comp = compMap[lang] ?? compMap.default
  parent.properties = parent.properties ?? {}
  parent.properties.id = elId
  const vnode = cloneVNode(comp, { code, lang, rootId: elId })
  idxMap[elId] = { mdId, elId, vnode, code, lang }
}

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
    visit(tree, selectAll("pre", tree), (node, index, parent) => {
      const elId = "id-" + uniqueId()
      if (isElement(parent, "div")) {
        if (!hasProperty(parent, "id")) {
          newVNode(mdId, elId, idxMap, compMap, node, parent)
        }
      } else {
        if (isUndefined(index)) return
        const wrap = parseSelector(`div#${elId}`)
        wrap.children = [node]
        parent.children[index] = wrap
        newVNode(mdId, elId, idxMap, compMap, node, parent)
      }
    })
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
