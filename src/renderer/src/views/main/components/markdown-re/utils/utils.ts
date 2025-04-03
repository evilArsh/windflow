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
export const getLang = (node): string => {
  if (!node) return ""
  if (Array.isArray(node.children)) {
    const code = node.children.find(item => item.tagName === "code")
    if (code) {
      return (
        code.properties?.className?.find((item: string) => item.startsWith("language-"))?.replace("language-", "") ?? ""
      )
    }
  }
  return ""
}
