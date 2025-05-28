import { unified } from "unified"
import { VFile } from "vfile"
import remarkParse from "remark-parse"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import remarkEmoji from "remark-emoji"
import remarkSqueezeParagraphs from "remark-squeeze-paragraphs"
import remarkRehype from "remark-rehype"
import rehypeMathjax from "rehype-mathjax"
import rehypeStringify from "rehype-stringify"
import { rehypeHrToBr, rehypeUrlAttributes } from "./rehypeCode"
import { normalizeFormula } from "./utils"
import useMermaid from "../usable/useMermaid"
import { toVueRuntime } from "./toVueRuntime/index"
import { Components } from "./toVueRuntime/types"
export const createProcessor = () => {
  return (
    unified()
      .use(remarkParse) // 将Markdown解析为mdast
      .use(remarkMath, { singleDollarTextMath: true })
      .use(remarkSqueezeParagraphs)
      .use(remarkGfm)
      .use(remarkEmoji)
      // 将mdast解析为hast
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
  )
}
const parser = (components: Components) => {
  const mermaid = useMermaid()
  const html = shallowRef<any>()
  const processor = markRaw(createProcessor())
  const file = new VFile()
  const preHandleContent = (content: string) => {
    return normalizeFormula(content)
  }
  const parse = async (newContent: string) => {
    const content = preHandleContent(newContent)
    file.value = content
    const hast = processor.runSync(processor.parse(file))
    html.value = toVueRuntime(hast, {
      components,
      ignoreInvalidStyle: true,
      stylePropertyNameCase: "css",
      passKeys: true,
      passNode: true,
    })
  }
  mermaid.init()
  return {
    html,
    parse,
  }
}
export default parser
