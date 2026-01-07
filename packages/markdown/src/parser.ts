import { createProcessor, normalizeFormula } from "./utils"
import { Root } from "hast"
import { toVueRuntime } from "./vue"
import { Options } from "./vue/types"
import { merge } from "@toolmain/shared"
export function toVnode(hast: Root, options?: Options) {
  const vnode = toVueRuntime(
    hast,
    merge(
      {
        ignoreInvalidStyle: true,
        stylePropertyNameCase: "css",
        passNode: true,
      },
      options
    )
  )
  return vnode
}
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
