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
import { rehypeHrToBr, rehypeVueVnode } from "./rehypeCode"
import { CodePluginOptions } from "./types"
import { normalizeFormula } from "./utils"
import useMermaid from "../usable/useMermaid"
import { cloneVNode, render } from "vue"
import { visit } from "unist-util-visit"
import { RootContent, Root } from "mdast"

const mdProcessor = unified()
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

const cloneUn = () => {
  return (
    mdProcessor()
      .use(rehypeMathjax)
      .use(rehypeHighlight)
      // .use(rehypeHighlightCodeLines, {
      //   showLineNumbers: true,
      // })
      .use(rehypeHrToBr)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        allowDangerousCharacters: true,
      })
      .freeze()
  )
}
const cloneVnodeUn = (mdId: string, idxMap: Record<string, CodePluginOptions>, compMap: Record<string, VNode>) => {
  return (
    mdProcessor()
      .use(rehypeMathjax)
      .use(rehypeVueVnode, { mdId, idxMap, compMap })
      .use(rehypeHighlight)
      // .use(rehypeHighlightCodeLines, {
      //   showLineNumbers: true,
      // })
      .use(rehypeHrToBr)
      .use(rehypeStringify, {
        allowDangerousHtml: true,
        allowDangerousCharacters: true,
      })
      .freeze()
  )
}

const parser = (mdId: string, idxMap: Record<string, CodePluginOptions>, compMap: Record<string, VNode>) => {
  const mermaid = useMermaid()

  const html = ref<Array<string>>([]) // 完整的html块
  const partialHtml = ref("") // 正在pending的块

  const activeUn = markRaw(cloneUn())
  const vnodeUn = markRaw(cloneVnodeUn(mdId, idxMap, compMap))
  const file = new VFile()
  const partialFile = new VFile()

  // const cacheAst: RootContent[] = []
  const cacheRoot: Root[] = []
  const currentRoot = shallowRef<Root>()
  // const position = reactive({
  //   start: { line: 0, column: 0, offset: 0 },
  //   end: { line: 0, column: 0, offset: 0 },
  // })
  let lastPosition = 0
  const preHandleContent = (content: string, partial: boolean) => {
    if (!partial) {
      Object.keys(idxMap).forEach(key => {
        delete idxMap[key]
      })
    }
    return normalizeFormula(content)
  }
  /**
   * @description 所有内容加载完毕后render完整的vnode
   */
  const parse = async (content: string, partial: boolean) => {
    content = preHandleContent(content, partial)
    file.value = content
    partialFile.value = file.value.slice(lastPosition)
    const mast = activeUn.parse(partialFile)
    if (mast.children.length == 0) {
      console.log(mast)
    }
    if (mast.children.length > 0) {
      // 最后一块当成partial块
      const lastBlock = mast.children.slice(-1)[0] // 获取最后一个块
      const dividePosition = toNumber(lastBlock.position?.start.offset)
      if (partial) {
        mast.children = mast.children.slice(0, -1) // 去掉最后一个块
      }
      if (mast.children.length >= 0 && dividePosition > lastPosition) {
        const completeStr = vnodeUn.stringify(vnodeUn.runSync(mast))
        html.value.push(completeStr)
        lastPosition = dividePosition
      }
      if (partial && lastBlock) {
        mast.children = [lastBlock]
        const lastBlockStr = activeUn.stringify(activeUn.runSync(mast))
        partialHtml.value = lastBlockStr
      } else {
        partialHtml.value = ""
      }
    }

    // if (partial) {
    //   html.value = (await activeUn.process(content)).value.toString()
    // } else {
    //   html.value = (await vnodeUn.process(content)).value.toString()
    //   await nextTick()
    //   Object.values(idxMap).forEach(item => {
    //     const el = document.getElementById(item.elId)
    //     if (el) {
    //       item.vnode = cloneVNode(item.vnode, {
    //         rootId: item.elId,
    //         code: item.code,
    //         html: el.innerHTML,
    //         lang: item.lang,
    //       })
    //       el.innerHTML = ""
    //       render(item.vnode, el)
    //     }
    //   })
    //   mermaid.run()
    // }
  }
  mermaid.init()
  return {
    html,
    partialHtml,
    parse,
  }
}
export default parser
