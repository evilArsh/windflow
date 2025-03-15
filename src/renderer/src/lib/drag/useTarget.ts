import { initDragAttr, initRect } from "./types"
import type { DragAttr, Pos, Rect, Target } from "./types"
import useEvent from "@renderer/lib/shared/useEvent"

// const isFinalEqual = (node?: HTMLElement | null, dst?: HTMLElement): boolean => {
//   if (!(node && dst) || node === document.body) {
//     return false
//   }
//   if (node === dst) {
//     return true
//   }
//   return isFinalEqual(node.parentElement, dst)
// }

export default <T extends HTMLElement>(): Target<T> => {
  let ele: T | undefined | null
  let rect: Rect = initRect()
  let attr: DragAttr = initDragAttr()
  let disabled = false
  // 指针偏移量计算
  const _offset = { x: 0, y: 0 }
  const _movePos = { left: 0, top: 0 }
  const ev = useEvent()
  let isEleDown = false
  // --- event start
  function _setTargetAttr(e: PointerEvent, pos?: Pos) {
    updateRect()
    setAttr({
      x: rect.x,
      y: rect.y,
      clientX: e.clientX,
      clientY: e.clientY,
      offsetLeft: pos?.left ?? ele?.offsetLeft ?? 0,
      offsetTop: pos?.top ?? ele?.offsetTop ?? 0,
      width: rect.width,
      height: rect.height,
    })
  }
  function _onSelectStart(e: Event) {
    if (isEleDown) {
      e.preventDefault()
      return false
    }
    return true
  }
  function _onDocPointerUp(_e: PointerEvent) {
    if (disabled) return
    if (!ele) {
      isEleDown = false
      return
    }
    if (isEleDown) {
      _emit("aftermove", { ...attr })
    }
    // if (!isFinalEqual(e.target as HTMLElement, ele)) {
    //   return
    // }
    // document.removeEventListener("selectstart", _onSelectStart)
    isEleDown = false
  }
  function _onDocPointerMove(e: PointerEvent) {
    if (disabled) return
    if (!isEleDown) return
    _movePos.left = e.clientX - _offset.x
    _movePos.top = e.clientY - _offset.y
    _setTargetAttr(e, _movePos)
    _emit("moving", { ...attr })
  }
  function _onElePointerDown(e: PointerEvent) {
    if (disabled) return
    isEleDown = true
    // document.addEventListener("selectstart", _onSelectStart)
    _setTargetAttr(e)
    _offset.x = e.clientX - attr.offsetLeft
    _offset.y = e.clientY - attr.offsetTop
    _emit("beforemove", { ...attr })
  }
  function _clearEvent() {
    document.removeEventListener("selectstart", _onSelectStart)
    ele?.removeEventListener("pointerdown", _onElePointerDown)
    document.removeEventListener("pointerup", _onDocPointerUp)
    document.removeEventListener("pointermove", _onDocPointerMove)
  }
  function _listenEvent() {
    if (ele) {
      document.addEventListener("selectstart", _onSelectStart)
      ele.addEventListener("pointerdown", _onElePointerDown)
      document.addEventListener("pointerup", _onDocPointerUp)
      document.addEventListener("pointermove", _onDocPointerMove)
    }
  }
  // --- event end
  function updateRect() {
    rect = ele?.getBoundingClientRect() ?? initRect()
  }
  function setAttr(newVal: DragAttr) {
    attr = { ...newVal }
  }
  /**
   * 设置新元素，并重置所有状态，包括事件监听
   */
  function setTarget(tar?: T | null) {
    _clearEvent()
    ele = tar
    ev.removeAllListeners()
    setAttr(initDragAttr())
    updateRect()
    _listenEvent()
  }

  function on(event: string, cb: (attr: DragAttr) => void) {
    ev.on(event, cb)
  }
  function _emit(type: string, ...args: any[]) {
    if (disabled) return
    ev.emit(type, ...args)
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
