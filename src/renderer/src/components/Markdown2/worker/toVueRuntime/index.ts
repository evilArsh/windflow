/**
 * @description changed origin: https://github.com/syntax-tree/hast-util-to-jsx-runtime.
 * for vue only
 * @author: arshdebian@163.com
 */

import type { Identifier, Literal, MemberExpression } from "estree"
import type { Element, Nodes, Parents, Root, Text } from "hast"
import type { MdxFlowExpressionHast, MdxTextExpressionHast } from "mdast-util-mdx-expression"
import type { MdxJsxFlowElementHast, MdxJsxTextElementHast } from "mdast-util-mdx-jsx"
import type { MdxjsEsmHast } from "mdast-util-mdxjs-esm"
import type { Position } from "unist"
import { Child, Create, Field, JsxElement, State, Style, Options, Props } from "./types"
import { stringify as commas } from "comma-separated-tokens"
import { ok as assert } from "devlop"
import { name as isIdentifierName } from "estree-util-is-identifier-name"
import { whitespace } from "hast-util-whitespace"
import { find, html, svg } from "property-information"
import { stringify as spaces } from "space-separated-tokens"
import styleToJs from "style-to-js"
import { VFileMessage } from "vfile-message"
import { h, Fragment } from "vue"

const emptyMap: Map<string, number> = new Map()
const cap = /[A-Z]/g
// `react-dom` triggers a warning for *any* white space in tables.
// To follow GFM, `mdast-util-to-hast` injects line endings between elements.
// Other tools might do so too, but they don’t do here, so we remove all of
// that.
// See: <https://github.com/facebook/react/pull/7081>.
// See: <https://github.com/facebook/react/pull/7515>.
// See: <https://github.com/remarkjs/remark-react/issues/64>.
// See: <https://github.com/rehypejs/rehype-react/pull/29>.
// See: <https://github.com/rehypejs/rehype-react/pull/32>.
// See: <https://github.com/rehypejs/rehype-react/pull/45>.
const tableElements = new Set(["table", "tbody", "thead", "tfoot", "tr"])
const tableCellElement = new Set(["td", "th"])
const docs = "https://github.com/syntax-tree/hast-util-to-jsx-runtime"

/**
 * Transform a hast tree to preact, react, solid, svelte, vue, etc.,
 * with an automatic JSX runtime.
 *
 * @param tree Tree to transform.
 * @param options Configuration (required).
 */
export function toVueRuntime(tree: Nodes, options: Options): JsxElement {
  if (!options) {
    throw new TypeError("Expected `Fragment` in options")
  }
  const filePath = options.filePath ?? undefined
  const create: Create = createVnode(filePath)
  const state: State = {
    ancestors: [],
    components: options.components || {},
    create,
    evaluater: options.createEvaluater ? options.createEvaluater() : undefined,
    filePath,
    ignoreInvalidStyle: options.ignoreInvalidStyle || false,
    passKeys: options.passKeys !== false,
    passNode: options.passNode || false,
    schema: options.space === "svg" ? svg : html,
    stylePropertyNameCase: options.stylePropertyNameCase || "dom",
    tableCellAlignToStyle: options.tableCellAlignToStyle !== false,
  }
  const result = one(state, tree)
  // JSX element.
  if (result && !isString(result)) {
    return result
  }
  // Text node or something that turned into nothing.
  return state.create(tree, Fragment, { children: result ?? undefined })
}

function createVnode(_: string | undefined): Create {
  return (_, type, props) => {
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
    // ! type: 为传入的 Compomnent
    // ! props: {children:string,class:string,node:Hast}
    const children = props.children
    if (isString(type)) {
      delete props.children
      return h(type, props, children)
    } else if (type === Fragment) {
      delete props.children
      return h(type, props, children)
    } else {
      return h(type, props, {
        default: () => children,
      })
    }
  }
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

  if (node.tagName.toLowerCase() === "svg" && parentSchema.space === "html") {
    schema = svg
    state.schema = schema
  }
  state.ancestors.push(node)
  // ! 当传入components后并匹配到了tagName,type是传入的函数
  const type = findComponentFromName(state, node.tagName, false)
  const props = createElementProps(state, node)
  let children = createChildren(state, node)

  if (tableElements.has(node.tagName)) {
    children = children.filter(function (child) {
      return isString(child) ? !whitespace(child) : true
    })
  }

  // ! props.node = xx
  addNode(state, props, type, node)
  addChildren(props, children)

  // Restore.
  state.ancestors.pop()
  state.schema = parentSchema

  return state.create(node, type, props)
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
  return state.create(node, Fragment, props)
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
 * Add `node` to props.
 * @param state - Info passed around.
 *param props - Props.
 * @param type - Type.
 * @param node - Node.
 */
function addNode(
  state: State,
  props: Props,
  type: any,
  node: Element | MdxJsxFlowElementHast | MdxJsxTextElementHast
): void {
  // If this is swapped out for a component:
  // ! 当tagName有component单独处理时,eg:components: { code: Component},type为Component
  // ! node为当前tabName的hast:
  if (!isString(type) && type !== Fragment && state.passNode) {
    props.node = node
  }
}

/**
 * Add children to props.
 * @param props - Props.
 * @param children - Children.
 */
function addChildren(props: Props, children: Child[]): void {
  if (children.length > 0) {
    const value = children.length > 1 ? children : children[0]
    if (value) {
      props.children = value
    }
  }
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

  return state.create(node, type, props)
}

/**
 * Create props from an element.
 * @param state - Info passed around.
 * @param node - Current element.
 */
function createElementProps(state: State, node: Element): Props {
  const props: Props = {}
  let alignValue: string | undefined
  let prop: string

  for (prop in node.properties) {
    if (prop !== "children" && Object.hasOwn(node.properties, prop)) {
      const result = createProperty(state, prop, node.properties[prop])
      if (result) {
        const [key, value] = result
        if (state.tableCellAlignToStyle && key === "align" && isString(value) && tableCellElement.has(node.tagName)) {
          alignValue = value
        } else {
          props[key] = value
        }
      }
    }
  }

  if (alignValue) {
    // Assume style is an object.
    const style = props.style || (props.style = {})
    style[state.stylePropertyNameCase === "css" ? "text-align" : "textAlign"] = alignValue
  }

  return props
}

/**
 * Create props from a JSX element.
 * @param state - Info passed around.
 * @param node - Current JSX element.
 */
function createJsxElementProps(state: State, node: MdxJsxFlowElementHast | MdxJsxTextElementHast): Props {
  const props: Props = {}

  for (const attribute of node.attributes) {
    if (attribute.type === "mdxJsxExpressionAttribute") {
      if (attribute.data && attribute.data.estree && state.evaluater) {
        const program = attribute.data.estree
        const expression = program.body[0]
        assert(expression.type === "ExpressionStatement")
        const objectExpression = expression.expression
        assert(objectExpression.type === "ObjectExpression")
        const property = objectExpression.properties[0]
        assert(property.type === "SpreadElement")

        Object.assign(props, state.evaluater.evaluateExpression(property.argument))
      } else {
        crashEstree(state, node.position)
      }
    } else {
      // For JSX, the author is responsible of passing in the correct values.
      const name = attribute.name
      let value: unknown

      if (attribute.value && isObject(attribute.value)) {
        if (attribute.value.data && attribute.value.data.estree && state.evaluater) {
          const program = attribute.value.data.estree
          const expression = program.body[0]
          assert(expression.type === "ExpressionStatement")
          value = state.evaluater.evaluateExpression(expression.expression)
        } else {
          crashEstree(state, node.position)
        }
      } else {
        value = attribute.value === null ? true : attribute.value
      }

      // Assume a prop.
      props[name] = value
    }
  }

  return props
}

/**
 * Create children.
 * @param state - Info passed around.
 * @param node - Current element.
 */
function createChildren(state: State, node: Parents): Child[] {
  const children: Child[] = []
  let index = -1
  // Note: test this when Solid doesn't want to merge my upcoming PR.
  /* c8 ignore next */
  const countsByName: Map<string, number> = state.passKeys ? new Map() : emptyMap

  while (++index < node.children.length) {
    const child = node.children[index]

    if (state.passKeys) {
      const name =
        child.type === "element"
          ? child.tagName
          : child.type === "mdxJsxFlowElement" || child.type === "mdxJsxTextElement"
            ? child.name
            : undefined

      if (name) {
        const count = countsByName.get(name) || 0
        countsByName.set(name, count + 1)
      }
    }

    const result = one(state, child)
    if (result !== undefined) children.push(result)
  }

  return children
}

/**
 * Handle a property.
 * @param state - Info passed around.
 * @param prop - Key.
 * @param value - hast property value.
 */
function createProperty(
  state: State,
  prop: string,
  value: Array<number | string> | boolean | number | string | null | undefined
): Field | undefined {
  const info = find(state.schema, prop)
  // Ignore nullish and `NaN` values.
  if (value === null || value === undefined || !isNumber(value)) {
    return
  }
  if (Array.isArray(value)) {
    // Accept `array`.
    // Most props are space-separated.
    value = info.commaSeparated ? commas(value) : spaces(value)
  }
  // React only accepts `style` as object.
  if (info.property === "style") {
    let styleObject = isObject(value) ? value : parseStyle(state, String(value))
    if (state.stylePropertyNameCase === "css") {
      styleObject = transformStylesToCssCasing(styleObject)
    }
    return ["style", styleObject]
  }

  return [info.attribute, value]
}

/**
 * Parse a CSS declaration to an object.
 * @param state - Info passed around.
 * @param value - CSS declarations.
 * @throws Throws `VFileMessage` when CSS cannot be parsed.
 */
function parseStyle(state: State, value: string): Style {
  try {
    return styleToJs(value, { reactCompat: true })
  } catch (error) {
    if (state.ignoreInvalidStyle) {
      return {}
    }
    const cause = error as Error
    const message = new VFileMessage("Cannot parse `style` attribute", {
      ancestors: state.ancestors,
      cause,
      ruleId: "style",
      source: "hast-util-to-jsx-runtime",
    })
    message.file = state.filePath || undefined
    message.url = docs + "#cannot-parse-style-attribute"

    throw message
  }
}

/**
 * Create a JSX name from a string.
 * @param state - To do.
 * @param name - Name.
 * @param allowExpression - Allow member expressions and identifiers.
 */
function findComponentFromName(state: State, name: string, allowExpression: boolean): unknown {
  let result: Identifier | Literal | MemberExpression

  if (!allowExpression) {
    result = { type: "Literal", value: name }
  } else if (name.includes(".")) {
    const identifiers = name.split(".")
    let index = -1
    let node: Identifier | Literal | MemberExpression | undefined

    while (++index < identifiers.length) {
      const prop: Identifier | Literal = isIdentifierName(identifiers[index])
        ? { type: "Identifier", name: identifiers[index] }
        : { type: "Literal", value: identifiers[index] }
      node = node
        ? {
            type: "MemberExpression",
            object: node,
            property: prop,
            computed: Boolean(index && prop.type === "Literal"),
            optional: false,
          }
        : prop
    }

    assert(node, "always a result")
    result = node
  } else {
    result =
      isIdentifierName(name) && !/^[a-z]/.test(name) ? { type: "Identifier", name } : { type: "Literal", value: name }
  }

  // Only literals can be passed in `components` currently.
  // No identifiers / member expressions.
  if (result.type === "Literal") {
    const name = result.value as string | number
    return Object.hasOwn(state.components, name) ? state.components[name] : name
  }

  // Assume component.
  if (state.evaluater) {
    return state.evaluater.evaluateExpression(result)
  }

  crashEstree(state)
}

/**
 * @param state
 * @param place
 */
function crashEstree(state: State, place?: Position): never {
  const message = new VFileMessage("Cannot handle MDX estrees without `createEvaluater`", {
    ancestors: state.ancestors,
    place,
    ruleId: "mdx-estree",
    source: "hast-util-to-jsx-runtime",
  })
  message.file = state.filePath || undefined
  message.url = docs + "#cannot-handle-mdx-estrees-without-createevaluater"

  throw message
}

/**
 * Transform a DOM casing style object to a CSS casing style object.
 * @param domCasing
 */
function transformStylesToCssCasing(domCasing: Style): Style {
  const cssCasing: Style = {}
  let from: string

  for (from in domCasing) {
    if (Object.hasOwn(domCasing, from)) {
      cssCasing[transformStyleToCssCasing(from)] = domCasing[from]
    }
  }

  return cssCasing
}

/**
 * Transform a DOM casing style field to a CSS casing style field.
 * @param from
 */
function transformStyleToCssCasing(from: string): string {
  let to = from.replace(cap, toDash)
  // Handle `ms-xxx` -> `-ms-xxx`.
  if (to.slice(0, 3) === "ms-") to = "-" + to
  return to
}

/**
 * Make `$0` dash cased.
 * @param $0 - Capitalized ASCII letter.
 */
function toDash($0: string): string {
  return "-" + $0.toLowerCase()
}
