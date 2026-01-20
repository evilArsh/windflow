import mermaid from "mermaid"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import remarkEmoji from "remark-emoji"
import remarkSqueezeParagraphs from "remark-squeeze-paragraphs"
import remarkRehype from "remark-rehype"
import rehypeMathjax from "rehype-mathjax"
import rehypeStringify from "rehype-stringify"
import { isArray, isString, isNumber } from "@toolmain/shared"
import { visit } from "unist-util-visit"
import { urlAttributes } from "html-url-attributes"
import type { Element } from "hast"

/**
 * @description 统一处理公式格式
 */
export function normalizeFormula(content: string) {
  return content.replace(
    /(```[\s\S]*?```|`.*?`)|\\\((.*?)\\\)|\\\[([\s\S]*?[^\\])\\\]/g,
    (str, code, roundBrackets, squareBrackets) => {
      if (code) {
        return code
      } else if (squareBrackets) {
        return `
$$
${squareBrackets}
$$`
      } else if (roundBrackets) {
        return `$${roundBrackets}$`
      }
      return str
    }
  )
}

/**
 * wrap content as code block
 */
export function wrapAsCode(content: string, lang: string) {
  return `\`\`\`${lang}
${content}
\`\`\``
}

/**
 * @description 获取代码块语言
 */
export const getLang = (node?: Element): string => {
  if (!node) return ""
  const className = node.properties?.className ?? ""
  if (!className) return ""
  if (isString(className)) {
    return className.match(/language-(\w+)/)?.[1] ?? ""
  }
  if (isArray(className)) {
    const lang = className.find(item => String(item).startsWith("language-"))
    if (isString(lang)) {
      return lang.match(/language-(\w+)/)?.[1] ?? ""
    }
  }
  return ""
}

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
  return (tree: any) => {
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
  return (tree: any) => {
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

export const createProcessor = () => {
  return unified()
    .use(remarkParse)
    .use(remarkMath, { singleDollarTextMath: true })
    .use(remarkSqueezeParagraphs)
    .use(remarkGfm)
    .use(remarkEmoji)
    .use(remarkRehype, {
      allowDangerousHtml: false,
      allowDangerousCharacters: false,
    })
    .use(rehypeMathjax)
    .use(rehypeHrToBr)
    .use(rehypeUrlAttributes)
    .use(rehypeStringify, {
      allowDangerousHtml: false,
      allowDangerousCharacters: false,
    })
}

export const useMermaid = () => {
  function init() {
    mermaid.initialize({
      startOnLoad: true,
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
      theme: "default",
    })
  }
  function run() {
    mermaid.run()
  }
  return {
    init,
    run,
  }
}
