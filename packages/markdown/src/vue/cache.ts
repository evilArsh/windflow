import { Nodes } from "hast"
import type { Position } from "estree"
import { Child } from "./types"

export function useCache() {
  const cache = new Map<
    string,
    {
      node: Child
      start: Position
      end: Position
    }
  >()
  function positionEqual(a: Position, b: Position): boolean {
    return a.column === b.column && a.line === b.line
  }
  /**
   * a unique block starts at unique `start-position`, which includes fixed column and line
   */
  function generateKey(node: Nodes, start: Position): string {
    const name = node.type === "element" ? `${node.type}-${node.tagName}` : node.type
    const key = `${name}-${start.column}-${start.line}`
    return key
  }
  function getPosition(node: Nodes): [Position | undefined, Position | undefined] {
    return [node.position?.start, node.position?.end]
  }
  /**
   * Cache only when both `position.start` and `position.end` are defined.
   *
   * Reason: For a block that is still being parsed (e.g., a code block),
   * the `start` position remains fixed, while `end.position.column` increments.
   * In this case, the new result should override the existing cache.
   */
  function add(node: Nodes, vnode: Child): void {
    const [start, end] = getPosition(node)
    // if (node.type === "root") {
    //   return
    // }
    if (start && end) {
      const key = generateKey(node, start)
      cache.set(key, {
        node: vnode,
        start,
        end,
      })
    }
  }
  /**
   * If a block is still being parsed, treat it as uncached and skip the cache lookup,
   * even if an entry for it exists.
   */
  function get(node: Nodes): Child | undefined {
    const [start, end] = getPosition(node)
    if (start && end) {
      const key = generateKey(node, start)
      const c = cache.get(key)
      // block was parsed completely
      if (c && positionEqual(c.end, end)) {
        // console.log(`[cache hint] key: ${key}, position: `, node.position)
        return c.node
      }
    }
    return
  }
  function clear() {
    cache.clear()
  }
  return { add, get, clear }
}
