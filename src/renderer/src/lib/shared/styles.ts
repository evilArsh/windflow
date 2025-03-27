import { isString, isNumber } from "@renderer/lib/shared/is"

/**
 * from
 * library:   @vueuse/motion
 * function:  useElementStyle
 */
import type { ValueType } from "style-value-types"
import { alpha, color, complex, degrees, filter, number, progressPercentage, px as _px, scale } from "style-value-types"

type ValueTypeMap = Record<string, ValueType>

/**
 * ValueType for "auto"
 */
export const auto: ValueType = {
  test: (v: any) => v === "auto",
  parse: v => v,
}

/**
 * ValueType for ints
 */
const int = {
  ...number,
  transform: Math.round,
}

export const valueTypes: ValueTypeMap = {
  // Color props
  color,
  backgroundColor: color,
  outlineColor: color,
  fill: color,
  stroke: color,

  // Border props
  borderColor: color,
  borderTopColor: color,
  borderRightColor: color,
  borderBottomColor: color,
  borderLeftColor: color,
  borderWidth: _px,
  borderTopWidth: _px,
  borderRightWidth: _px,
  borderBottomWidth: _px,
  borderLeftWidth: _px,
  borderRadius: _px,
  radius: _px,
  borderTopLeftRadius: _px,
  borderTopRightRadius: _px,
  borderBottomRightRadius: _px,
  borderBottomLeftRadius: _px,

  // Positioning props
  width: _px,
  maxWidth: _px,
  height: _px,
  maxHeight: _px,
  size: _px,
  top: _px,
  right: _px,
  bottom: _px,
  left: _px,

  // Spacing props
  padding: _px,
  paddingTop: _px,
  paddingRight: _px,
  paddingBottom: _px,
  paddingLeft: _px,
  margin: _px,
  marginTop: _px,
  marginRight: _px,
  marginBottom: _px,
  marginLeft: _px,

  // Transform props
  rotate: degrees,
  rotateX: degrees,
  rotateY: degrees,
  rotateZ: degrees,
  scale,
  scaleX: scale,
  scaleY: scale,
  scaleZ: scale,
  skew: degrees,
  skewX: degrees,
  skewY: degrees,
  distance: _px,
  translateX: _px,
  translateY: _px,
  translateZ: _px,
  x: _px,
  y: _px,
  z: _px,
  perspective: _px,
  transformPerspective: _px,
  opacity: alpha,
  originX: progressPercentage,
  originY: progressPercentage,
  originZ: _px,

  // Misc
  zIndex: int,
  filter,
  WebkitFilter: filter,

  // SVG
  fillOpacity: alpha,
  strokeOpacity: alpha,
  numOctaves: int,
}

/**
 * Return the value type for a key.
 *
 * @param key
 */
export const getValueType = (key: string) => valueTypes[key]

/**
 * Transform the value using its value type, or return the value.
 *
 * @param value
 * @param type
 */
export function getValueAsType(value: any, type?: ValueType) {
  return type && typeof value === "number" && type.transform ? type.transform(value) : value
}

/**
 * Get default animatable
 *
 * @param key
 * @param value
 */
export function getAnimatableNone(key: string, value: string): any {
  let defaultValueType = getValueType(key)
  if (defaultValueType !== filter) defaultValueType = complex
  // If value is not recognised as animatable, ie "none", create an animatable version origin based on the target
  return defaultValueType.getAnimatableNone ? defaultValueType.getAnimatableNone(value) : undefined
}

export function getValue(key: string, value: string | number | undefined): any {
  const type = getValueType(key)
  return getValueAsType(value, type)
}

export function setStyle(ele?: HTMLElement, styles?: Partial<CSSStyleDeclaration>) {
  if (!(ele && styles)) {
    return
  }
  Object.assign(ele.style, styles)
}

export function px(value: string | number | undefined) {
  if (!value) {
    return "0"
  }
  if (isString(value)) {
    return value
  }
  return value + "px"
}

export function toNumber(value: string | number | undefined): number {
  if (typeof value === "undefined") {
    return 0
  }
  if (isNumber(value)) {
    return value
  } else {
    const num = parseFloat(value)
    return isNaN(num) ? 0 : num
  }
}
