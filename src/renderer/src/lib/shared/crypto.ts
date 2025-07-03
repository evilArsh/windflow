import { nanoid, customAlphabet } from "nanoid"
export const NanoIdAlphabetFn = "_-123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
/**
 * @description 生成基于`nanoid`的随机字符串
 */
export const uniqueId = (): string => {
  return uniqueNanoId()
}
/**
 * @description 生成基于`nanoid`的随机字符串
 * @param length 字符串长度
 * @param alphaBet 自定义字符集
 */
export const uniqueNanoId = (alphaBet?: string, length?: number): string => {
  if (!alphaBet) return nanoid(length)
  return customAlphabet(alphaBet, length)()
}
/**
 * @description 生成基于`nanoid`的符合函数命名规则的字符串
 * @param length 字符串长度
 */
export const uniqueNanoFnId = (length: number): string => {
  return uniqueNanoId(NanoIdAlphabetFn, length)
}
