import { createProcessor, normalizeFormula } from "./utils"
export const useParser = () => {
  const processor = createProcessor()
  async function parse(rawContent: string) {
    try {
      const content = normalizeFormula(rawContent)
      const hast = await processor.run(processor.parse(content))
      return hast
    } catch (error) {
      console.error("[error in Markdown parse]", error)
    }
  }
  return {
    parse,
  }
}
