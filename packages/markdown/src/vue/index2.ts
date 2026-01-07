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
import { Fragment } from "vue"
import { isString, isUndefined } from "@toolmain/shared"
import {
  addChildren,
  addNode,
  crashEstree,
  createElementProps,
  createJsxElementProps,
  createVnode,
  findComponentFromName,
  tableElements,
} from "./utils"

export function useVueRuntime(options: Options) {
  const state: State = {
    ancestors: [],
    components: options.components ?? {},
    evaluater: options.createEvaluater?.(),
    ignoreInvalidStyle: !!options.ignoreInvalidStyle,
    passNode: !!options.passNode,
    schema: options.space === "svg" ? svg : html,
    stylePropertyNameCase: options.stylePropertyNameCase || "dom",
    tableCellAlignToStyle: !!options.tableCellAlignToStyle,
  }
  function toVnode(tree: Nodes): JSX.Element {
    const result = one(tree)
    // JSX element.
    if (result && !isString(result)) {
      return result
    }
    // Text node or something that turned into nothing.
    return createVnode(tree, Fragment, { children: result ?? undefined })
  }
  /**
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
  /**
   * Transform a node.
   */
  function one(node: Nodes): Child | undefined {
    if (node.type === "element") {
      return element(node)
    }
    if (node.type === "root") {
      return root(node)
    }
    if (node.type === "text") {
      return text(node)
    }
    if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
      return mdxExpression(node)
    }
    if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
      return mdxJsxElement(node)
    }
    if (node.type === "mdxjsEsm") {
      return mdxEsm(node)
    }
  }
  /**
   * Handle element.
   */
  function element(node: Element): Child | undefined {
    const parentSchema = state.schema
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
      children = children.filter(function (child) {
        return isString(child) ? !whitespace(child) : true
      })
    }

    addNode(state, props, type, node)
    addChildren(props, children)

    // Restore.
    state.ancestors.pop()
    state.schema = parentSchema

    return createVnode(node, type, props)
  }

  /**
   * Handle root.
   */
  function root(node: Root): Child | undefined {
    const props: Props = {}
    addChildren(props, createChildren(node))
    return createVnode(node, Fragment, props)
  }

  /**
   * Handle text.
   */
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
  return { toVnode }
}
