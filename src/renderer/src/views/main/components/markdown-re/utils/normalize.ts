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
