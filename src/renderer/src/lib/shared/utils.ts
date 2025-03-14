import { ulid } from "ulid"

/**
 * 从node与其父节点和dst比较直到body元素
 */
export const isFinalEqual = (node?: HTMLElement | null, dst?: HTMLElement): boolean => {
  if (!(node && dst) || node === document.body) {
    return false
  }
  if (node === dst) {
    return true
  }
  return isFinalEqual(node.parentElement, dst)
}

/**
 * from @vue/core packages/shared/src/index.ts
 */

export const objectToString = Object.prototype.toString
export const toTypeString = (value: unknown): string => objectToString.call(value)
export const isArray = Array.isArray
export const isMap = (val: unknown): val is Map<any, any> => toTypeString(val) === "[object Map]"
export const isSet = (val: unknown): val is Set<any> => toTypeString(val) === "[object Set]"
export const isDate = (val: unknown): val is Date => toTypeString(val) === "[object Date]"
export const isRegExp = (val: unknown): val is RegExp => toTypeString(val) === "[object RegExp]"
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const isFunction = (val: unknown): val is Function => typeof val === "function"
export const isString = (val: unknown): val is string => typeof val === "string"
export const isNumber = (val: unknown): val is number => typeof val === "number" && !isNaN(val)
export const isSymbol = (val: unknown): val is symbol => typeof val === "symbol"
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === "object"
export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch)
}
export const isUndefined = (val: unknown): val is undefined => typeof val === "undefined"
export const isBoolean = (val: unknown): val is boolean => typeof val === "boolean"
export const uniqueId = (seed?: number): string => {
  return ulid(seed)
}

/**
 * 将字符串组装为路径格式
 * @param path 路径或路径数组
 * @param withPrefix 是否需要 `/`前缀
 * @example eg: ["foo","bar"] ==> "foo/bar"
 */
export const resolvePath = (path: string | string[], withPrefix: boolean = true): string => {
  let p: string = ""
  let _path = Array.isArray(path) ? path.join("/") : path
  _path = _path.replace(/\/{1,}/g, "/")
  _path = _path === "/" ? _path : _path.endsWith("/") ? _path.slice(0, -1) : _path
  if (withPrefix) {
    p = "/" + _path
  } else {
    p = _path.startsWith("/") ? _path.substring(1) : _path
  }
  return p.replace(/\/{1,}/g, "/")
}
