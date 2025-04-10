import { unified } from "unified"
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
import { rehypeHrToBr, rehypeVueVnode } from "./rehypeCode"
import { CodePluginOptions } from "./types"

const mdUn = unified()
  .use(remarkParse)
  .use(remarkMath, { singleDollarTextMath: true })
  .use(remarkSqueezeParagraphs)
  .use(remarkGfm)
  .use(remarkEmoji)
  .use(remarkRehype, {
    allowDangerousHtml: true,
    allowDangerousCharacters: true,
    format: "html",
  })
  .freeze()

export const cloneUn = () => {
  return mdUn()
    .use(rehypeMathjax)
    .use(rehypeHighlight)
    .use(rehypeHighlightCodeLines, {
      showLineNumbers: true,
    })
    .use(rehypeHrToBr)
    .use(rehypeStringify, {
      allowDangerousHtml: true,
      allowDangerousCharacters: true,
    })
    .freeze()
}
export const cloneVnodeUn = (
  mdId: string,
  idxMap: Record<string, CodePluginOptions>,
  compMap: Record<string, VNode>
) => {
  return mdUn()
    .use(rehypeMathjax)
    .use(rehypeVueVnode, { mdId, idxMap, compMap })
    .use(rehypeHighlight)
    .use(rehypeHighlightCodeLines, {
      showLineNumbers: true,
    })
    .use(rehypeHrToBr)
    .use(rehypeStringify, {
      allowDangerousHtml: true,
      allowDangerousCharacters: true,
    })
    .freeze()
}
