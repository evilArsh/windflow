import type { Identifier, Literal, MemberExpression } from "estree"
import type { Element } from "hast"
import type { MdxJsxFlowElementHast, MdxJsxTextElementHast } from "mdast-util-mdx-jsx"
import type { Position } from "unist"
import { Child, Field, State, Style, Props } from "./types"
import { stringify as commas } from "comma-separated-tokens"
import { ok as assert } from "devlop"
import { name as isIdentifierName } from "estree-util-is-identifier-name"
import { find } from "property-information"
import { stringify as spaces } from "space-separated-tokens"
import styleToJs from "style-to-js"
import { VFileMessage } from "vfile-message"
import { Fragment } from "vue"
import { isObject, isString } from "@toolmain/shared"

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
export const tableElements = new Set(["table", "tbody", "thead", "tfoot", "tr"])
export const tableCellElement = new Set(["td", "th"])

/**
 * Add `node` to props.
 */
export function addNode(
  state: State,
  props: Props,
  type: any,
  node: Element | MdxJsxFlowElementHast | MdxJsxTextElementHast
): void {
  // If this is swapped out for a component:
  // ! 当tagName有component单独处理时,eg:components: { code: Component},type为Component
  // ! node为当前tagName的hast,会被传入type为Component的node属性中
  if (!isString(type) && type !== Fragment && state.passNode) {
    props.node = node
  }
}

/**
 * Create props from an element.
 * @param state - Info passed around.
 * @param node - Current element.
 */
export function createElementProps(state: State, node: Element): Props {
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
    if (!props.style) props.style = {}
    if (isObject(props.style)) {
      const key: string = state.stylePropertyNameCase === "css" ? "text-align" : "textAlign"
      props.style = {
        ...props.style,
        [key]: alignValue,
      }
    } else {
      throw new Error("props.style is unknown type")
    }
  }

  return props
}

/**
 * Add children to props.
 */
export function addChildren(props: Props, children: Child[]): void {
  if (children.length) {
    props.children = children.length > 1 ? children : children[0]
  }
}

export function crashEstree(state: State, place?: Position): never {
  const message = new VFileMessage("Cannot handle MDX estrees without `createEvaluater`", {
    ancestors: state.ancestors,
    place,
    ruleId: "mdx-estree",
    source: "hast-util-to-jsx-runtime",
  })
  throw message
}

/**
 * Create a JSX name from a string.
 * @param state - To do.
 * @param name - Name.
 * @param allowExpression - Allow member expressions and identifiers.
 */
export function findComponentFromName(state: State, name: string, allowExpression: boolean): unknown {
  let result: Identifier | Literal | MemberExpression

  if (!allowExpression) {
    result = { type: "Literal", value: name }
  } else if (name.includes(".")) {
    const identifiers = name.split(".")
    let index = -1
    let node: Identifier | Literal | MemberExpression | undefined
    while (++index < identifiers.length) {
      const prop: Identifier | Literal = isIdentifierName(identifiers[index])
        ? { type: "Identifier", name: identifiers[index] } // 标识符
        : { type: "Literal", value: identifiers[index] } // 字面值
      node = node
        ? {
            type: "MemberExpression", // 成员表达式
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
  if (value === null || value === undefined || (typeof value === "number" && Number.isNaN(value))) {
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
 * Create props from a JSX element.
 * @param state - Info passed around.
 * @param node - Current JSX element.
 */
export function createJsxElementProps(state: State, node: MdxJsxFlowElementHast | MdxJsxTextElementHast): Props {
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
      if (isObject(attribute.value)) {
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
      props[name] = value as any
    }
  }

  return props
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
    throw message
  }
}

/**
 * Transform a DOM casing style field to a CSS casing style field.
 * @param from
 */
function transformStyleToCssCasing(from: string): string {
  let to = from.replace(/[A-Z]/g, toDash)
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
