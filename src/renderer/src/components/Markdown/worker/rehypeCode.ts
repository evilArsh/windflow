import { visit } from "unist-util-visit"
import { urlAttributes } from "html-url-attributes"
// import { toString } from "hast-util-to-string"
// import { CodePluginOptions } from "./types"
// import { cloneVNode } from "vue"
// import { getLang } from "./utils"
// import { isElement } from "hast-util-is-element"
// import { selectAll } from "hast-util-select"
// import { parseSelector } from "hast-util-parse-selector"
// import { hasProperty } from "hast-util-has-property"

// const newVNode = (
//   mdId: string,
//   elId: string,
//   idxMap: Record<string, CodePluginOptions>,
//   compMap: Record<string, VNode>,
//   node: any,
//   parent: any
// ) => {
//   const codeNode = node.children.find(child => isElement(child, "code"))
//   const code = codeNode ? toString(codeNode) : ""
//   const lang = getLang(node)
//   const comp = compMap[lang] ?? compMap.default
//   parent.properties = parent.properties ?? {}
//   parent.properties.id = elId
//   const vnode = cloneVNode(comp, { code, lang, rootId: elId })
//   idxMap[elId] = { mdId, elId, vnode, code, lang }
// }

// --- rehypeUrlAttributes
const safeProtocol = /^(https?|ircs?|mailto|xmpp)$/i
function urlTransform(value: string) {
  const colon = value.indexOf(":")
  const questionMark = value.indexOf("?")
  const numberSign = value.indexOf("#")
  const slash = value.indexOf("/")
  if (
    // If there is no protocol, it’s relative.
    colon === -1 ||
    // If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
    (slash !== -1 && colon > slash) ||
    (questionMark !== -1 && colon > questionMark) ||
    (numberSign !== -1 && colon > numberSign) ||
    // It is a protocol, it should be allowed.
    safeProtocol.test(value.slice(0, colon))
  ) {
    return value
  }
  return ""
}

export const rehypeUrlAttributes = () => {
  return tree => {
    visit(tree, (node, index, parent) => {
      if (isNumber(index) && parent) {
        if (node.type === "raw") {
          console.log("[visit raw]", node)
          parent.children[index] = { type: "text", value: node.value }
          return
        }
      }
      if (node.type === "element") {
        // console.log("[visit element]", node)
        for (const key in urlAttributes) {
          if (Object.hasOwn(urlAttributes, key) && Object.hasOwn(node.properties, key)) {
            const value = node.properties[key]
            const test = urlAttributes[key]
            if (test === null || test.includes(node.tagName)) {
              node.properties[key] = urlTransform(String(value || ""))
            }
          }
        }
      }
    })
  }
}

// --- rehypeHrToBr
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
