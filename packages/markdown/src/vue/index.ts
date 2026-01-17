/**
 * @description change origin: https://github.com/syntax-tree/hast-util-to-jsx-runtime.
 * for vue only
 * @author: arshdebian@163.com
 */

import type { Element, Nodes, Parents, Root, Text } from "hast"
import type { MdxFlowExpressionHast, MdxTextExpressionHast } from "mdast-util-mdx-expression"
import type { MdxJsxFlowElementHast, MdxJsxTextElementHast } from "mdast-util-mdx-jsx"
import type { MdxjsEsmHast } from "mdast-util-mdxjs-esm"
import { Child, State, Options, Props } from "./types"
import { ok as assert } from "devlop"
import { whitespace } from "hast-util-whitespace"
import { html, svg } from "property-information"
import { Fragment, VNode } from "vue"
import { isString, isUndefined } from "@toolmain/shared"
import {
  addChildren,
  addNode,
  crashEstree,
  createElementProps,
  createJsxElementProps,
  findComponentFromName,
  tableElements,
} from "./utils"
import { useCache } from "./cache"

export function useVueRuntime(options?: Options) {
  const state: State = {
    ancestors: [],
    components: options?.components ?? {},
    evaluater: options?.createEvaluater?.(),
    ignoreInvalidStyle: options?.ignoreInvalidStyle ?? false,
    passNode: options?.passNode ?? true,
    schema: options?.space === "svg" ? svg : html,
    stylePropertyNameCase: options?.stylePropertyNameCase || "dom",
    tableCellAlignToStyle: options?.tableCellAlignToStyle ?? true,
  }
  const cache = useCache()
  function toVnode(tree: Nodes): VNode {
    const result = one(tree)
    // JSX element.
    if (result && !isString(result)) {
      return result
    }
    // Text node or something that turned into nothing.
    return createVnode(tree, Fragment, { children: result ?? undefined })
  }
  function dispose() {
    cache.clear()
  }
  function createVnode(_node: Nodes, type: any, props: Props): VNode {
    // ! 在vue中jsx和jsxs都是h函数，并且当vue组件传入时
    // ! h的用法和hastscript不一样
    /**
     * vue普通节点和hastscript
     * h('div', ['hello', h('span', 'hello')])
     * vue组件
     * h(MyComponent, null, {
     *  default: () => 'default slot',
     *  foo: () => h('div', 'foo'),
     *  bar: () => [h('span', 'one'), h('span', 'two')]
     * })
     */
    const children: Props["children"] = props.children
    if (isString(type) || type === Fragment) {
      delete props.children
      return h(type, props, children)
    } else {
      // ! type: 为传入的 Compomnent
      // ! props: including `children` property
      return h(type, props, {
        default: () => children,
      })
    }
  } /**
   * Create children.
   * @param node - Current element.
   */
  function createChildren(node: Parents): Child[] {
    const children: Child[] = []
    let index = -1
    while (++index < node.children.length) {
      const child = node.children[index]
      const result = one(child)
      if (!isUndefined(result)) children.push(result)
    }
    return children
  }

  function one(node: Nodes): Child | undefined {
    const cacheNode = cache.get(node)
    if (cacheNode) {
      return cacheNode
    }
    let newCacheNode: Child | undefined
    switch (node.type) {
      case "element":
        newCacheNode = element(node)
        break
      case "root":
        newCacheNode = root(node)
        break
      case "text":
        newCacheNode = text(node)
        break
      case "mdxFlowExpression":
      case "mdxTextExpression":
        newCacheNode = mdxExpression(node)
        break
      case "mdxJsxFlowElement":
      case "mdxJsxTextElement":
        newCacheNode = mdxJsxElement(node)
        break
      case "mdxjsEsm":
        newCacheNode = mdxEsm(node)
    }
    if (newCacheNode) {
      cache.add(node, newCacheNode)
    }
    return newCacheNode
  }

  function element(node: Element): Child | undefined {
    const parentSchema = state.schema // svg or html
    let schema = parentSchema

    const tagName = node.tagName.toLowerCase()
    if (tagName === "svg" && parentSchema.space === "html") {
      schema = svg
      state.schema = schema
    }
    state.ancestors.push(node)
    // ! 当传入components后并匹配到了tagName, type是传入的组件
    const type = findComponentFromName(state, node.tagName, false)
    const props = createElementProps(state, node)
    let children = createChildren(node)

    if (tableElements.has(node.tagName)) {
      children = children.filter(child => {
        return isString(child) ? !whitespace(child) : true
      })
    }

    // ! add node to props
    addNode(state, props, type, node)
    // ! add children to props
    addChildren(props, children)

    //! restore status
    state.ancestors.pop()
    state.schema = parentSchema

    return createVnode(node, type, props)
  }

  function root(node: Root): Child | undefined {
    const props: Props = {}
    addChildren(props, createChildren(node))
    return createVnode(node, Fragment, props)
  }

  function text(node: Text): Child | undefined {
    return node.value
  }

  /**
   * Handle MDX expression.
   * @param state - Info passed around.
   * @param node - Current node.
   */
  function mdxExpression(node: MdxFlowExpressionHast | MdxTextExpressionHast): Child | undefined {
    if (node.data && node.data.estree && state.evaluater) {
      const program = node.data.estree
      const expression = program.body[0]
      assert(expression.type === "ExpressionStatement")
      return state.evaluater.evaluateExpression(expression.expression) as Child | undefined
    }
    crashEstree(state, node.position)
  }

  /**
   * Handle MDX ESM.
   */
  function mdxEsm(node: MdxjsEsmHast): Child | undefined {
    if (node.data?.estree && state.evaluater) {
      return state.evaluater.evaluateProgram(node.data.estree) as Child | undefined
    }
    crashEstree(state, node.position)
  }

  /**
   * Handle MDX JSX.
   * @param state - Info passed around.
   * @param node - Current node.
   * @param key - Key.
   */
  function mdxJsxElement(node: MdxJsxFlowElementHast | MdxJsxTextElementHast): Child | undefined {
    const parentSchema = state.schema
    let schema = parentSchema

    if (node.name === "svg" && parentSchema.space === "html") {
      schema = svg
      state.schema = schema
    }

    state.ancestors.push(node)

    const type = node.name === null ? Fragment : findComponentFromName(state, node.name, true)
    const props = createJsxElementProps(state, node)
    const children = createChildren(node)

    addNode(state, props, type, node)
    addChildren(props, children)

    // Restore.
    state.ancestors.pop()
    state.schema = parentSchema

    return createVnode(node, type, props)
  }
  return { toVnode, dispose }
}
