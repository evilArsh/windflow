import { visit } from "unist-util-visit"
import { select, selectAll } from "hast-util-select"
import { parseSelector } from "hast-util-parse-selector"
import { CodePluginOptions } from "./types"

export default ({ idxMap, compMap }: { idxMap: Record<string, CodePluginOptions>; compMap: Record<string, VNode> }) => {
  return tree => {
    const selected = selectAll("code", tree)
    if (selected.length > 0) {
      visit(tree, selected, (node, index, parent) => {
        if (!isUndefined(index)) {
          // TODO:确定语言类型，拿到code块原始数据
          const wrap = parseSelector(`div#${uniqueId()}`)
          wrap.children = [node]
          parent.children[index] = wrap
        }
      })
    }
  }
}
