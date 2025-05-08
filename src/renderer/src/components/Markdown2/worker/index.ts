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
import rehypeHighlight from "rehype-highlight"
import rehypeHighlightCodeLines from "rehype-highlight-code-lines"
import { rehypeHrToBr, rehypeUrlAttributes } from "./rehypeCode"
import { getLang, normalizeFormula } from "./utils"
import useMermaid from "../usable/useMermaid"
import { toJsxRuntime } from "hast-util-to-jsx-runtime"
import { toString } from "hast-util-to-string"
import { Fragment, jsx } from "vue/jsx-runtime"
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
  return mdProcessor()
    .use(rehypeMathjax)
    .use(rehypeHighlight)
    .use(rehypeHighlightCodeLines, {
      showLineNumbers: true,
    })
    .use(rehypeHrToBr)
    .use(rehypeUrlAttributes)
    .use(rehypeStringify, {
      allowDangerousHtml: true,
      allowDangerousCharacters: true,
    })
    .freeze()
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
    html.value = toJsxRuntime(hast, {
      Fragment: Fragment,
      jsx,
      jsxs: jsx,
      components: {
        code: props => {
          const code = toString(props.node)
          const lang = getLang(props.class)
          return h(CodeBlock, {
            code: code,
            html: code,
            lang,
            rootId: "",
          })
        },
      },
      ignoreInvalidStyle: true,
      elementAttributeNameCase: "html",
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
