import type { Dir, MoveOptions, DragAttr, EventMap, MoveType } from "./types"
import useEvent from "@renderer/usable/useEvent"
import useTarget from "./useTarget"
export default function (): MoveType {
  const ev = useEvent()
  let moving = false
  const opt: MoveOptions = {
    direction: "any",
  }
  const tar = useTarget()

  const dirChange = (data: DragAttr) => {
    if (opt.direction === "horizontal") {
      data.clientY = 0
      data.y = 0
    } else if (opt.direction === "vertical") {
      data.clientX = 0
      data.x = 0
    }
  }
  function setTarget(target?: HTMLElement | null) {
    moving = false
    tar.setTarget(target)
    tar.on("beforemove", (data: DragAttr) => {
      dirChange(data)
      moving = false
      emit("beforemove", data)
    })
    tar.on("moving", (data: DragAttr) => {
      dirChange(data)
      moving = true
      emit("moving", data)
    })
    tar.on("aftermove", (data: DragAttr) => {
      dirChange(data)
      moving = false
      emit("aftermove", data)
    })
  }
  function getTarget() {
    return tar.ele
  }
  function emit<K extends keyof EventMap>(event: K, data: DragAttr) {
    ev.emit(event, data)
  }
  /**
   * 设置移动方向和移动方式
   */
  function setDirection(dir: Dir) {
    opt.direction = dir
  }
  function on<K extends keyof EventMap>(event: K, cb: EventMap[K]) {
    ev.on(event, cb)
  }
  function once<K extends keyof EventMap>(event: K, cb: EventMap[K]) {
    ev.once(event, cb)
  }
  function every<K extends keyof EventMap>(event: K, cb: EventMap[K]) {
    ev.removeAllListeners(event)
    ev.on(event, cb)
  }
  function updateOption(options?: MoveOptions) {
    if (!options) return
    Object.assign(opt, options)
  }
  function enable() {
    tar.enable()
  }
  function disable() {
    tar.disable()
  }
  function isMoving() {
    return moving
  }
  return {
    every,
    setTarget,
    getTarget,
    setDirection,
    isMoving,
    on,
    once,
    updateOption,
    enable,
    disable,
  }
}
