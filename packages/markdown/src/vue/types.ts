import type { Expression, Program } from "estree"
import type { Element, Parents } from "hast"
import type { MdxJsxFlowElementHast, MdxJsxTextElementHast } from "mdast-util-mdx-jsx"
import type { Schema } from "property-information"

export type Child = JSX.Element | string | undefined

export type Components = {
  [TagName in keyof JSX.IntrinsicElements]?:
    | Component<JSX.IntrinsicElements[TagName] & ExtraProps>
    | keyof JSX.IntrinsicElements
}

export type ClassComponent<ComponentProps> = new (props: ComponentProps) => JSX.ElementClass
/**
 * Function or class component.
 *
 * You can access props at `JsxIntrinsicElements`.
 * For example, to find props for `a`, use `JsxIntrinsicElements['a']`.
 *
 * @typeParam ComponentProps
 *   Props type.
 */
export type Component<ComponentProps> = ClassComponent<ComponentProps> | FunctionComponent<ComponentProps>

/**
 * Create an evaluator that turns ESTree ASTs from embedded MDX into values.
 */
export type CreateEvaluater = () => Evaluater

/**
 * Turn an MDX expression into a value.
 */
export type EvaluateExpression = (expression: Expression) => unknown
/**
 * Turn an MDX program (export/import statements) into a value.
 */
export type EvaluateProgram = (expression: Program) => unknown

/**
 * Evaluator that turns ESTree ASTs from embedded MDX into values.
 */
export interface Evaluater {
  /**
   * Evaluate an expression.
   */
  evaluateExpression: EvaluateExpression
  /**
   * Evaluate a program.
   */
  evaluateProgram: EvaluateProgram
}

/**
 * Extra fields we pass.
 */
export interface ExtraProps {
  /**
   * Node (hast),
   * passed when `passNode` is on.
   */
  node?: Element | undefined
}

/**
 * Property field.
 */
export type Field = [string, Value]

/**
 * Represent the children, typically a symbol.
 */
export type Fragment = unknown

/**
 * Basic functional component: given props, returns an element.
 *
 * @typeParam ComponentProps
 *   Props type.
 * @param props
 *   Props.
 * @returns
 *   Result.
 */
export type FunctionComponent<ComponentProps> = (props: ComponentProps) => JSX.Element | string | undefined

/**
 * Configuration.
 */
export interface OptionsBase {
  /**
   * Components to use (optional).
   */
  components?: Components
  /**
   * Create an evaluator that turns ESTree ASTs into values (optional).
   */
  createEvaluater?: CreateEvaluater
  /**
   * Ignore invalid CSS in `style` props (default: `false`);
   * the default behavior is to throw an error.
   */
  ignoreInvalidStyle?: boolean
  /**
   * Pass the hast element node to components (default: `false`).
   */
  passNode?: boolean
  /**
   * Whether `tree` is in the `'html'` or `'svg'` space (default: `'html'`).
   *
   * When an `<svg>` element is found in the HTML space, this package already
   * automatically switches to and from the SVG space when entering and exiting
   * it.
   */
  space?: Space
  /**
   * Specify casing to use for property names in `style` objects (default:
   * `'dom'`).
   */
  stylePropertyNameCase?: StylePropertyNameCase
  /**
   * Turn obsolete `align` props on `td` and `th` into CSS `style` props
   * (default: `true`).
   */
  tableCellAlignToStyle?: boolean
}

export type Options = OptionsBase

/**
 * Properties and children.
 */
export interface Props {
  [prop: string]: Array<Child> | Child | Element | MdxJsxFlowElementHast | MdxJsxTextElementHast | Value | undefined
  children?: Array<Child> | Child
  node?: Element | MdxJsxFlowElementHast | MdxJsxTextElementHast
}

/**
 * Info about source.
 */
export interface Source {
  /**
   * Column where thing starts (0-indexed).
   */
  columnNumber?: number
  /**
   * Name of source file.
   */
  fileName?: string
  /**
   * Line where thing starts (1-indexed).
   */
  lineNumber?: number
}

/**
 * Namespace.
 *
 * > 👉 **Note**: hast is not XML.
 * > It supports SVG as embedded in HTML.
 * > It does not support the features available in XML.
 * > Passing SVG might break but fragments of modern SVG should be fine.
 * > Use `xast` if you need to support SVG as XML.
 */
export type Space = "html" | "svg"

/**
 * Info passed around.
 */
export interface State {
  /**
   * Stack of parents.
   */
  ancestors: Array<Parents>
  /**
   * Components to swap.
   */
  components: Partial<Components>
  /**
   * Evaluator that turns ESTree ASTs into values.
   */
  evaluater?: Evaluater
  /**
   * Ignore invalid CSS in `style` props.
   */
  ignoreInvalidStyle: boolean
  /**
   * Pass `node` to components.
   */
  passNode: boolean
  /**
   * Current schema.
   */
  schema: Schema
  /**
   * Casing to use for property names in `style` objects.
   */
  stylePropertyNameCase: StylePropertyNameCase
  /**
   * Turn obsolete `align` props on `td` and `th` into CSS `style` props.
   */
  tableCellAlignToStyle: boolean
}

/**
 * Casing to use for property names in `style` objects.
 *
 * CSS casing is for example `background-color` and `-webkit-line-clamp`.
 * DOM casing is for example `backgroundColor` and `WebkitLineClamp`.
 */
export type StylePropertyNameCase = "css" | "dom"

/**
 * Style map.
 */
export type Style = Record<string, string>

/**
 * Primitive property value and `Style` map.
 */
export type Value = Style | boolean | number | string
