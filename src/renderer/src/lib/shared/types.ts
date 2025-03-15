import type * as CSS from "csstype"

export type ArrMutKeys = "splice" | "push" | "pop" | "shift" | "unshift"
/**
 * 定长数组类型
 */
export type FixedArray<T, L extends number> = Pick<T[], Exclude<keyof T[], ArrMutKeys>> & {
  readonly length: L
}

export interface CallBack {
  callback: (...arg: any[]) => void
}
export type CallBackFn = (...arg: any[]) => void
export type AsyncCallBackFn = (...arg: any[]) => Promise<void>

export interface CSSProperties extends CSS.Properties<string | number>, CSS.PropertiesHyphen<string | number> {
  // for css variable
  [v: `--${string}`]: string | number | undefined
}
