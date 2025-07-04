export type InitType = "auto" | "inherit" | "initial" | "unset"
export type Dir = "horizontal" | "vertical" | "any"
export interface CallBack {
  callback: (...arg: unknown[]) => void
}
export type CallBackFn = (...arg: unknown[]) => void
export type AsyncCallBackFn<T = unknown> = (...arg: unknown[]) => Promise<T>
export interface MoveOptions {
  /**
   * 移动方向
   */
  direction?: Dir
}
export interface DragAttr {
  /**
   * 元素x轴坐标
   */
  x: number
  /**
   * 元素y轴坐标
   */
  y: number
  /**
   * 指针x坐标
   */
  clientX: number
  /**
   * 指针y坐标
   */
  clientY: number
  offsetLeft: number
  offsetTop: number
  width: number | InitType
  height: number | InitType
  zIndex?: number | InitType
}
export interface Rect {
  height: number
  bottom: number
  left: number
  right: number
  top: number
  width: number
  x: number
  y: number
}
export type MoveParams = DragAttr & MoveOptions
export interface EventMap {
  beforemove: (pos: MoveParams) => void
  aftermove: (pos: MoveParams) => void
  moving: (pos: MoveParams) => void
}

export interface Pos {
  left: number
  top: number
}
export interface MoveType {
  setTarget: (target?: HTMLElement | null) => void
  getTarget: () => HTMLElement | null | undefined
  setDirection: (dir: Dir) => void
  on: <K extends keyof EventMap>(event: K, cb: EventMap[K]) => void
  once: <K extends keyof EventMap>(event: K, cb: EventMap[K]) => void
  /**
   * every means the object will not listen the same event repeatly,but only one time.
   * it's not that after being triggerd,the event listener will be removed,it still exist.
   */
  every: <K extends keyof EventMap>(event: K, cb: EventMap[K]) => void
  updateOption: (opt: MoveOptions) => void
  disable: () => void
  enable: () => void
}
export interface Target<T extends HTMLElement> {
  readonly ele?: T | null
  // getBoundingClientRect
  readonly rect: Rect
  // 目标元素当前位置参数
  readonly attr: DragAttr
  updateRect: () => void
  setAttr: (newVal: DragAttr) => void
  setTarget: (tar?: T | null) => void
  on: (event: string, cb: (attr: DragAttr) => void) => void
  disable: () => void
  enable: () => void
}

export function initDragAttr(): DragAttr {
  return {
    x: 0,
    y: 0,
    offsetLeft: 0,
    offsetTop: 0,
    clientX: 0,
    clientY: 0,
    width: 0,
    height: 0,
  }
}

export function initRect(): Rect {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  }
}
