import { unified } from "unified"
import { VFile } from "vfile"
import remarkParse from "remark-parse"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import remarkEmoji from "remark-emoji"
import remarkSqueezeParagraphs from "remark-squeeze-paragraphs"
import remarkRehype from "remark-rehype"
// import remarkStringify from "remark-stringify"
// import remarkMdx from "remark-mdx"
import rehypeMathjax from "rehype-mathjax"
import rehypeStringify from "rehype-stringify"
// import rehypeHighlight from "rehype-highlight"
// import rehypeHighlightCodeLines from "rehype-highlight-code-lines"
import { rehypeHrToBr, rehypeUrlAttributes } from "./rehypeCode"
import { normalizeFormula } from "./utils"
import useMermaid from "../usable/useMermaid"
import { toVueRuntime } from "./toVueRuntime/index"
// import { toString } from "hast-util-to-string"
import CodeBlock from "../components/codeBlock.vue"
const mdProcessor = unified()
  // 将Markdown解析为mdast
  .use(remarkParse)
  .use(remarkMath, { singleDollarTextMath: true })
  .use(remarkSqueezeParagraphs)
  .use(remarkGfm)
  .use(remarkEmoji)
  // 将mdast解析为hast
  .use(remarkRehype, {
    allowDangerousHtml: true,
    allowDangerousCharacters: true,
    format: "html",
  })
  .freeze()

const createProcessor = () => {
  return (
    mdProcessor()
      .use(rehypeMathjax)
      // .use(rehypeHighlight)
      // .use(rehypeHighlightCodeLines, {
      //   showLineNumbers: true,
      // })
      .use(rehypeHrToBr)
      .use(rehypeUrlAttributes)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        allowDangerousCharacters: true,
      })
      .freeze()
  )
}
const parser = () => {
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
    console.log("[hast]", hast)
    const node = toVueRuntime(hast, {
      components: {
        code: CodeBlock,
      },
      ignoreInvalidStyle: true,
      stylePropertyNameCase: "css",
      passKeys: true,
      passNode: true,
    })
    html.value = node
  }
  mermaid.init()
  return {
    html,
    parse,
  }
}
export default parser
