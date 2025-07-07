import { initDragAttr, initRect } from "./types"
import type { DragAttr, Rect, Target } from "./types"
import useEvent from "@renderer/usable/useEvent"

export default (): Target => {
  let ele: HTMLElement | undefined | null
  let rect: Rect = initRect()
  let attr: DragAttr = initDragAttr()
  let disabled = false
  let isEleDown = false
  const ev = useEvent()
  const inner = {
    emit: (type: string, ...args: any[]) => {
      if (disabled) return
      ev.emit(type, ...args)
    },
    setTargetAttr: (e: PointerEvent): void => {
      updateRect()
      setAttr({
        x: rect.x,
        y: rect.y,
        clientX: e.clientX,
        clientY: e.clientY,
        width: rect.width,
        height: rect.height,
      })
    },
    onSelectStart: (e: Event): boolean => {
      if (isEleDown) {
        e.preventDefault()
        return false
      }
      return true
    },
    onDomPointerUp: (_e: PointerEvent): void => {
      if (disabled) return
      if (!ele) {
        isEleDown = false
        return
      }
      if (isEleDown) {
        inner.emit("aftermove", { ...attr })
      }
      isEleDown = false
    },
    onDomPointerMove: (e: PointerEvent): void => {
      if (disabled) return
      if (!isEleDown) return
      inner.setTargetAttr(e)
      inner.emit("moving", { ...attr })
    },
    onElePointerDown: (e: PointerEvent): void => {
      if (disabled) return
      isEleDown = true
      inner.setTargetAttr(e)
      inner.emit("beforemove", { ...attr })
    },
    clearEvent: (): void => {
      document.removeEventListener("selectstart", inner.onSelectStart)
      ele?.removeEventListener("pointerdown", inner.onElePointerDown)
      document.removeEventListener("pointerup", inner.onDomPointerUp)
      document.removeEventListener("pointermove", inner.onDomPointerMove)
    },
    listenEvent: (): void => {
      if (ele) {
        document.addEventListener("selectstart", inner.onSelectStart)
        ele.addEventListener("pointerdown", inner.onElePointerDown)
        document.addEventListener("pointerup", inner.onDomPointerUp)
        document.addEventListener("pointermove", inner.onDomPointerMove)
      }
    },
  }
  function updateRect() {
    rect = ele?.getBoundingClientRect() ?? initRect()
  }
  function setAttr(newVal: DragAttr) {
    attr = { ...newVal }
  }
  /**
   * 设置新元素，并重置所有状态，包括事件监听
   */
  function setTarget(tar?: HTMLElement | null) {
    inner.clearEvent()
    ele = tar
    ev.removeAllListeners()
    setAttr(initDragAttr())
    updateRect()
    inner.listenEvent()
  }
  function on(event: string, cb: (attr: DragAttr) => void) {
    ev.on(event, cb)
  }
  function disable() {
    disabled = true
  }
  function enable() {
    disabled = false
  }
  return {
    ele,
    rect,
    attr,
    updateRect,
    setAttr,
    setTarget,
    on,
    disable,
    enable,
  }
}
