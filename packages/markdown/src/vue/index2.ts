/**
 * @description change origin: https://github.com/syntax-tree/hast-util-to-jsx-runtime.
 * for vue only
 * @author: arshdebian@163.com
 */

import type { Element, Nodes, Parents, Root, Text } from "hast"
import type { MdxFlowExpressionHast, MdxTextExpressionHast } from "mdast-util-mdx-expression"
import type { MdxJsxFlowElementHast, MdxJsxTextElementHast } from "mdast-util-mdx-jsx"
import type { MdxjsEsmHast } from "mdast-util-mdxjs-esm"
import { Child, CreateFn, State, Options, Props } from "./types"
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
  createVnodeFn,
  findComponentFromName,
  tableElements,
} from "./utils"

export function useVueRuntime(options: Options) {
  const createFn: CreateFn = createVnodeFn()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const state: State = {
    ancestors: [],
    components: options.components ?? {},
    createFn,
    evaluater: options.createEvaluater?.(),
    ignoreInvalidStyle: !!options.ignoreInvalidStyle,
    passNode: !!options.passNode,
    schema: options.space === "svg" ? svg : html,
    stylePropertyNameCase: options.stylePropertyNameCase || "dom",
    tableCellAlignToStyle: !!options.tableCellAlignToStyle,
  }
  /**
   * Create children.
   * @param state - Info passed around.
   * @param node - Current element.
   */
  function createChildren(state: State, node: Parents): Child[] {
    const children: Child[] = []
    let index = -1
    while (++index < node.children.length) {
      const child = node.children[index]
      const result = one(state, child)
      if (!isUndefined(result)) children.push(result)
    }
    return children
  }
  /**
   * Transform a node.
   *
   * @param Info passed around.
   * @param node Current node.
   * @param key Key.
   */
  function one(state: State, node: Nodes): Child | undefined {
    if (node.type === "element") {
      return element(state, node)
    }
    if (node.type === "root") {
      return root(state, node)
    }
    if (node.type === "text") {
      return text(state, node)
    }
    if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
      return mdxExpression(state, node)
    }
    if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
      return mdxJsxElement(state, node)
    }
    if (node.type === "mdxjsEsm") {
      return mdxEsm(state, node)
    }
  }
  /**
   * Handle element.
   *
   * @param state Info passed around.
   * @param node Current node.
   * @param key Key.
   */
  function element(state: State, node: Element): Child | undefined {
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
    let children = createChildren(state, node)

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

    return state.createFn(node, type, props)
  }

  /**
   * Handle root.
   * @param state - Info passed around.
   * @param node - Current node.
   * @param key - Key.
   */
  function root(state: State, node: Root): Child | undefined {
    const props: Props = {}
    addChildren(props, createChildren(state, node))
    return state.createFn(node, Fragment, props)
  }

  /**
   * Handle text.
   * @param _ - Info passed around.
   * @param node - Current node.
   */
  function text(_: State, node: Text): Child | undefined {
    return node.value
  }

  /**
   * Handle MDX expression.
   * @param state - Info passed around.
   * @param node - Current node.
   */
  function mdxExpression(state: State, node: MdxFlowExpressionHast | MdxTextExpressionHast): Child | undefined {
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
   * @param state - Info passed around.
   * @param node - Current node.
   */
  function mdxEsm(state: State, node: MdxjsEsmHast): Child | undefined {
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
  function mdxJsxElement(state: State, node: MdxJsxFlowElementHast | MdxJsxTextElementHast): Child | undefined {
    const parentSchema = state.schema
    let schema = parentSchema

    if (node.name === "svg" && parentSchema.space === "html") {
      schema = svg
      state.schema = schema
    }

    state.ancestors.push(node)

    const type = node.name === null ? Fragment : findComponentFromName(state, node.name, true)
    const props = createJsxElementProps(state, node)
    const children = createChildren(state, node)

    addNode(state, props, type, node)
    addChildren(props, children)

    // Restore.
    state.ancestors.pop()
    state.schema = parentSchema

    return state.createFn(node, type, props)
  }
}
