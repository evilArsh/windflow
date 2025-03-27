import { MoveParams, MoveType, type MoveOptions } from "@renderer/lib/drag/types"
import type { CSSProperties, FixedArray } from "@renderer/lib/shared/types"
import type { VNode, Component, MaybeRef, ShallowRef } from "vue"
import useScale from "./useScale"
import useHandle, { Status } from "./useHandle"
import { type Ref } from "vue"
export interface ScaleConfig {
  /**
   * 组件ID
   */
  id?: string
  /**
   * 手动设置容器ID
   */
  containerId?: string
  /**
   * 拖拽组件名字
   */
  name?: string
  /**
   * 组件可改变尺寸
   */
  scalable?: boolean
  /**
   * 组件可移动
   */
  movable?: boolean
  /**
   * 组件可最小化
   */
  minimized?: boolean
  /**
   * 组件可最大化
   */
  maximized?: boolean
  /**
   * 组件可关闭
   */
  closable?: boolean
  /**
   * 变成正常元素
   */
  normal?: boolean
  /**
   * 拖动后自动靠边
   */
  autoStick?: boolean | AnimateDir
  /**
   * 元素渲染后先隐藏，优先级高于最小化
   */
  hideFirst?: boolean | AnimateDir
  /**
   * 元素渲染后先最小化
   */
  minFirst?: boolean
  /**
   * 元素渲染后先最大化
   */
  maxFirst?: boolean
  /**
   * 是否拥有默认头部
   */
  defaultHeader?: boolean
  /**
   * 是否拥有默认的工具栏
   */
  defaultToolbar?: boolean
  /**
   * 当组件`position`不为`fixed`时
   * 是否相对于window定位,否则相对于父元素定位
   *
   * @default false
   */
  attachWindow?: boolean
  /**
   * 移动功能的配置项
   */
  moveConfig?: MoveOptions
  /**
   * 外壳样式
   */
  containerStyle?: ScaleStyleProps
  /**
   * 内容样式，初始宽高应该在这里设置
   */
  contentStyle?: ScaleStyleProps
  /**
   * 头部样式
   */
  headerStyle?: ScaleStyleProps
  /**
   * 是否显示遮罩层
   */
  mask?: boolean
  /**
   * 遮罩层样式
   */
  maskStyle?: ScaleStyleProps
}
export interface ScaleProps {
  modelValue: ScaleConfig
  /**
   * 按下目标元素并拖动组件，默认按下头部拖动。
   */
  target?: MaybeRef<HTMLElement | null | undefined>
}
export interface ScalePropsBase {
  modelValue: ScaleConfig
  /**
   * 按下目标元素并拖动组件，默认按下头部拖动。
   */
  target?: MaybeRef<HTMLElement | null | undefined>
}
export interface BaseMountedParams {
  /**
   * 组件配置数据
   */
  config: Ref<Required<ScaleConfig>>
  /**
   * 当前组件
   */
  drag: ShallowRef<HTMLElement | null>
  /**
   * 当前组件内容部分
   */
  content: ShallowRef<HTMLElement | null>
  dragOffset: Ref<DragOffset>
  scale?: ReturnType<typeof useScale>
  /**
   * index.vue组件提供
   */
  handle?: ReturnType<typeof useHandle>
  move?: Ref<MoveType | undefined>
}

export interface ScaleExtraConfNode {
  label: string
  node: VNode | Component | string
}

export type AnimateDir = "left" | "top" | "bottom" | "right" | "self" | "center" | { x?: number; y?: number }
export interface MoveHook {
  x?: (oldVal: number, newVal: number, width: number, height: number) => number
  y?: (oldVal: number, newVal: number, width: number, height: number) => number
  scale?: (
    oldVal: FixedArray<number, 2>,
    newVal: FixedArray<number, 2>
  ) => [FixedArray<number, 2>, FixedArray<number, 2>]
}
// | FixedArray<number, 2>
export interface ScaleInstance {
  /**
   * 智能移动到屏幕边界
   * @param animate - 是否有动画效果 default: true
   */
  autoStick: (animate: boolean) => Promise<void>
  /**
   * 自动隐藏
   * @param animate - 是否有动画效果 default: true
   */
  autoHide: (animate: boolean) => Promise<void>
  /**
   * 移动到屏幕边界
   * @param animate - 是否有动画效果 default: true
   */
  stickTo: (dir: AnimateDir, animate: boolean) => Promise<void>
  /**
   * 移动到屏幕 `dir`位置并隐藏
   * @param animate - 是否有动画效果 default: true
   */
  hideTo: (dir: AnimateDir, animate: boolean) => Promise<void>
  /**
   * 显示组件
   */
  show: (animate: boolean, dir?: AnimateDir) => Promise<void>
  /**
   * 最小化组件
   */
  min: (animate: boolean) => Promise<void>
  /**
   * 最大化组件
   */
  max: (animate: boolean) => Promise<void>
  /**
   * 组件从最小化恢复正常
   */
  minReverse: (animate: boolean) => Promise<void>
  /**
   * 组件从最大化恢复正常
   */
  maxReverse: (animate: boolean) => Promise<void>
  /**
   * 当组件`position:fixed`或者`attachWindow:true`时坐标相对于屏幕左上角;否则相对于父元素
   */
  moveTo: (animate: boolean, dir: AnimateDir, hooks?: MoveHook) => Promise<void>
  /**
   * 获取当前状态
   */
  getStatus: () => Status | undefined
}
export type ScaleStyleProps = CSSProperties

/**
 * 拖拽时transform计算的坐标
 */
export interface DragOffset {
  /**
   * pointer按下时的X坐标
   */
  prevClientX: number
  /**
   * pointer按下时的Y坐标
   */
  prevClientY: number
  /**
   * 上次移动之后的translateX
   */
  prevTranslateX: number
  /**
   * 上次移动之后的translateY
   */
  prevTranslateY: number
  /**
   * 正在移动时的translateX
   */
  translateX: number
  /**
   * 正在移动时的translateY
   */
  translateY: number
  scale: FixedArray<number, 2>
}
export type MoveEvent = MoveParams & {
  translateX: number
  translateY: number
}
