import type { AnimateDir, DragOffset, MoveHook, ScaleConfig } from "./types"
import { px, toNumber } from "@renderer/lib/shared/styles"
import useFlip, { type FlipParam } from "@renderer/usable/useFlip"
import { Reactive, ShallowRef } from "vue"
import { AsyncCallBackFn, CallBackFn, FixedArray } from "@renderer/lib/shared/types"
import { useElementBounding } from "@vueuse/core"
import useEvent from "@renderer/usable/useEvent"
import { isNumber } from "@renderer/lib/shared/is"
import { useDragOffset } from "./helper"
import { type Ref } from "vue"
export enum Status {
  NORMAL = "NORMAL",
  HIDDEN = "HIDDEN",
}
export enum HandleEv {
  AFTER_SHOW = "after_show",
  AFTER_HIDE = "after_hide",
  AFTER_STICK = "after_stick",
}
export default (data: {
  config: Ref<ScaleConfig>
  targetEle: Readonly<ShallowRef<HTMLElement | null>>
  dragOffset: Reactive<DragOffset>
  parent?: HTMLElement
}) => {
  // const containerStyle = toRef(data.config.value, "containerStyle")
  // const { get: getContainer, sets: setContainers } = useStyleHandler(containerStyle)
  const { getTranslate, setTranslate, setScale, setPrevTranslate, getScale } = useDragOffset(data.dragOffset)
  let parent: HTMLElement | undefined | null = data.parent
  const flip = useFlip()
  const ev = useEvent()
  const status = ref<Status>(Status.NORMAL)
  const duration = {
    min: 300,
    stick: 160,
    show: 160,
  }
  const tmp = {
    transX: { old: 0, final: 0 },
    transY: { old: 0, final: 0 },
    maxToNormal: () => {},
  }
  const asyncBeforeHide: AsyncCallBackFn[] = []
  const asyncBeforeStick: AsyncCallBackFn[] = []
  function refreshTmp() {
    const { translateX, translateY } = getTranslate()
    tmp.transX.old = translateX
    tmp.transX.final = translateX
    tmp.transY.old = translateY
    tmp.transY.final = translateY
  }
  const { x: tarX, y: tarY, width, left } = useElementBounding(data.targetEle)
  function parentRect(targetStyle: CSSStyleDeclaration, attachWindow?: boolean) {
    const windowRect = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
    if (!data.targetEle.value) {
      return windowRect
    }
    const position = targetStyle.position
    if (position === "fixed") {
      return windowRect
    } else {
      // TODO: 待验证:元素贴边时因为父元素滚动条占一部分宽度，导致会被隐藏一部分
      if (attachWindow) return windowRect
      const p = getTargetParent()
      windowRect.width = p.offsetWidth
      windowRect.height = p.offsetHeight
      return windowRect
    }
  }
  function finalCalculate(x: number, y: number, _w: number, _h: number, scale: FixedArray<number, 2>) {
    return () => {
      setScale(scale[0], scale[1])
      setTranslate(x, y)
      setPrevTranslate(x, y)
    }
  }
  /**
   * 元素吸附到屏幕边界计算
   */
  function stickCalculate(dir: AnimateDir, hooks?: MoveHook): { x: number; y: number; w: number; h: number } {
    const res = { x: 0, y: 0, w: 0, h: 0 }
    if (!data.targetEle.value) return res
    const hook = Object.assign(
      {
        x: (_oldVal: number, newVal: number, _width: number, _height: number) => newVal,
        y: (_oldVal: number, newVal: number, _width: number, _height: number) => newVal,
        scale: (oldVal: FixedArray<number, 2>, newVal: FixedArray<number, 2>) => [oldVal, newVal],
      },
      hooks
    )
    const attachWindow = !!data.config.value.attachWindow
    const targetStyle = window.getComputedStyle(data.targetEle.value)
    const parent = parentRect(targetStyle, attachWindow)
    let l = 0
    let t = 0
    const w = toNumber(targetStyle.width)
    const h = toNumber(targetStyle.height)
    res.w = w
    res.h = h
    const { translateX: oldX, translateY: oldY } = getTranslate()
    if (targetStyle.position === "fixed") {
      l = toNumber(targetStyle.left)
      t = toNumber(targetStyle.top)
    } else {
      if (attachWindow) {
        l = toNumber(tarX.value - oldX)
        t = toNumber(tarY.value - oldY)
      } else {
        l = toNumber(targetStyle.left)
        t = toNumber(targetStyle.top)
      }
    }
    if (typeof dir === "string") {
      switch (dir) {
        case "left": {
          res.x = hook.x(oldX, -toNumber(l), w, h)
          res.y = hook.y(oldY, oldY, w, h)
          break
        }
        case "top": {
          res.x = hook.x(oldX, oldX, w, h)
          res.y = hook.y(oldY, -toNumber(t), w, h)
          break
        }
        case "right": {
          res.x = hook.x(oldX, -toNumber(l) + parent.width - w, w, h)
          res.y = hook.y(oldY, oldY, w, h)
          break
        }
        case "bottom": {
          res.x = hook.x(oldX, oldX, w, h)
          res.y = hook.y(oldY, -toNumber(t) + parent.height - h, w, h)
          break
        }
        case "self": {
          res.x = hook.x(oldX, oldX, w, h)
          res.y = hook.y(oldY, oldY, w, h)
          break
        }
        case "center":
        default: {
          res.x = hook.x(oldX, -toNumber(l) + parent.width / 2 - w / 2, w, h)
          res.y = hook.y(oldY, -toNumber(t) + parent.height / 2 - h / 2, w, h)
        }
      }
    } else {
      if (isNumber(dir.x)) {
        res.x = hook.x(oldX, -toNumber(l) + (dir.x ?? oldX), w, h)
      } else {
        res.x = hook.x(oldX, oldX, w, h)
      }
      if (isNumber(dir.y)) {
        res.y = hook.y(oldY, -toNumber(t) + (dir.y ?? oldY), w, h)
      } else {
        res.y = hook.y(oldY, oldY, w, h)
      }
    }
    return res
  }
  async function doAnimate(
    target: HTMLElement,
    animate: boolean,
    reset: CallBackFn,
    params: FlipParam[]
  ): Promise<void> {
    await new Promise<void>(resolve => {
      reset()
      if (!animate) {
        resolve()
        return
      }
      flip.animate(
        target,
        params,
        { duration: duration.stick, iterations: 1 },
        {
          finish(_status, _e) {
            resolve()
          },
        }
      )
    })
  }
  function autoDirection(): AnimateDir {
    const center = toNumber(left.value) + toNumber(width.value) / 2
    if (center >= window.innerWidth / 2) {
      return "right"
    } else {
      return "left"
    }
  }
  /**
   * 移动到指定位置
   */
  async function moveTo(animate: boolean = true, dir: AnimateDir, hooks?: MoveHook) {
    if (!data.targetEle.value) return
    const { x, y, w, h } = stickCalculate(dir, hooks)
    const { scaleX, scaleY } = getScale()
    const scale = {
      old: [scaleX, scaleY] as FixedArray<number, 2>,
      final: [scaleX, scaleY] as FixedArray<number, 2>,
    }
    if (hooks?.scale) {
      const res = hooks.scale(scale.old, scale.final)
      scale.old = res[0]
      scale.final = res[1]
    }
    const reset: CallBackFn = finalCalculate(x, y, w, h, scale.final)
    const { translateX, translateY } = getTranslate()
    const params: FlipParam[] = [
      { scale: scale.old, translate: [px(translateX), px(translateY)] },
      { scale: scale.final, translate: [px(x), px(y)] },
    ]
    await doAnimate(data.targetEle.value, animate, reset, params)
  }
  /**
   * 显示target元素
   */
  async function show(animate: boolean = true, dir?: AnimateDir): Promise<void> {
    if (status.value !== Status.HIDDEN) return
    if (!data.targetEle.value) return
    const start: FixedArray<number, 2> = [0, 0]
    const end: FixedArray<number, 2> = [1, 1]
    const params: FlipParam[] = [
      { scale: end, translate: [px(tmp.transX.final), px(tmp.transY.final)] },
      { scale: end, translate: [px(tmp.transX.old), px(tmp.transY.old)] },
    ]
    const reset: CallBackFn = () => {
      setScale(end[0], end[1])
      setTranslate(tmp.transX.old, tmp.transY.old)
      setPrevTranslate(tmp.transX.old, tmp.transY.old)
    }
    if (dir) {
      await moveTo(animate, dir, {
        scale(_oldVal, _newVal) {
          if (dir === "self" || dir === "center") {
            return [start, end]
          }
          return [end, end]
        },
      })
    } else {
      await doAnimate(data.targetEle.value, animate, reset, params)
    }
    status.value = Status.NORMAL
    ev.emit(HandleEv.AFTER_SHOW)
  }
  async function hideTo(dir: AnimateDir, animate: boolean = true): Promise<void> {
    if (status.value !== Status.NORMAL) return
    if (!data.targetEle.value) return
    for await (const hook of asyncBeforeHide) {
      await hook()
    }
    refreshTmp()
    const { x, y, w, h } = stickCalculate(dir, {
      x: (_oldVal: number, newVal: number, w: number, _h: number) => {
        switch (dir) {
          case "left":
            return (newVal -= toNumber(w))
          case "right":
            return (newVal += toNumber(w))
        }
        return newVal
      },
      y: (_oldVal: number, newVal: number, _w: number, h: number) => {
        switch (dir) {
          case "top":
            return (newVal -= toNumber(h))
          case "bottom":
            return (newVal += toNumber(h))
        }
        return newVal
      },
    })
    const { translateX, translateY } = getTranslate()
    let params: FlipParam[] = [
      { scale: [1, 1], translate: [px(translateX), px(translateY)] },
      { scale: [1, 1], translate: [px(x), px(y)] },
    ]
    if (dir === "self" || dir === "center") {
      params = [
        { scale: [1, 1], translate: [px(x), px(y)] },
        { scale: [0, 0], translate: [px(x), px(y)] },
      ]
    }
    tmp.transX.final = x
    tmp.transY.final = y
    const reset = finalCalculate(x, y, w, h, [0, 0])
    await doAnimate(data.targetEle.value, animate, reset, params)
    status.value = Status.HIDDEN
    ev.emit(HandleEv.AFTER_HIDE)
  }
  /**
   * 移动到屏幕边界
   */
  async function stickTo(dir: AnimateDir, animate: boolean = true): Promise<void> {
    if (status.value !== Status.NORMAL) return
    if (!data.targetEle.value) return
    for await (const hook of asyncBeforeStick) {
      await hook()
    }
    await moveTo(animate, dir)
    ev.emit(HandleEv.AFTER_STICK)
  }
  async function autoHide(animate: boolean = true): Promise<void> {
    if (status.value !== Status.NORMAL) return
    await hideTo(autoDirection(), animate)
  }
  async function autoStick(animate: boolean = true): Promise<void> {
    if (status.value !== Status.NORMAL) return
    await stickTo(autoDirection(), animate)
  }
  function setStatus(s: Status) {
    status.value = s
  }
  function getStatus(): Status {
    return status.value
  }
  function getTarget(): HTMLElement | null {
    return data.targetEle.value
  }
  function on(e: HandleEv, cb: CallBackFn) {
    ev.on(e, cb)
  }
  function registerBeforeHideHook(hook: AsyncCallBackFn) {
    asyncBeforeHide.push(hook)
  }
  function registerBeforeStickHook(hook: AsyncCallBackFn) {
    asyncBeforeStick.push(hook)
  }
  /**
   * 手动设置drag元素的父元素
   */
  function setTargetParent(targetParent: HTMLElement | null | undefined) {
    if (targetParent) {
      parent = targetParent
    }
  }
  /**
   * 获取drag元素的父元素，顺序为：
   * `parent` > `data.targetEle.value?.parentElement` > `document.body`
   */
  function getTargetParent() {
    return parent ?? data.targetEle.value?.parentElement ?? document.body
  }
  function dispose() {
    ev.removeAllListeners()
    asyncBeforeHide.length = 0
    asyncBeforeStick.length = 0
  }
  return {
    getTarget,
    setStatus,
    getStatus,
    show,
    autoHide,
    autoStick,
    stickTo,
    hideTo,
    moveTo,
    dispose,
    registerBeforeHideHook,
    registerBeforeStickHook,
    on,
    setTargetParent,
    getTargetParent,
  }
}
