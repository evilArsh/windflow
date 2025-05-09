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
