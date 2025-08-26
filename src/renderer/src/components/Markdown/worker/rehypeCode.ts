import { visit } from "unist-util-visit"
import { urlAttributes } from "html-url-attributes"
import { isNumber } from "@toolmain/shared"
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
        // ! eg:<img >
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
