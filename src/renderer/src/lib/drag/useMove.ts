import type { Dir, MoveOptions, DragAttr, EventMap, MoveType, MoveParams } from "./types"
import useEvent from "@renderer/usable/useEvent"
import { isUndefined } from "@renderer/lib/shared/is"
import useTarget from "./useTarget"
export default function (): MoveType {
  const ev = useEvent()
  const opt: MoveOptions = {
    direction: "any",
  }
  const tar = useTarget()

  function _dirChange(data: DragAttr) {
    if (opt.direction === "horizontal") {
      data.clientY = 0
      data.y = 0
      data.offsetTop = 0
    } else if (opt.direction === "vertical") {
      data.clientX = 0
      data.x = 0
      data.offsetLeft = 0
    }
  }
  function setTarget(target?: HTMLElement | null) {
    tar.setTarget(target)
    tar.on("beforemove", (data: DragAttr) => {
      _dirChange(data)
      emit("beforemove", { ...data, ...opt })
    })
    tar.on("moving", (data: DragAttr) => {
      _dirChange(data)
      emit("moving", { ...data, ...opt })
    })
    tar.on("aftermove", (data: DragAttr) => {
      _dirChange(data)
      emit("aftermove", { ...data, ...opt })
    })
  }
  function getTarget() {
    return tar.ele
  }
  function emit<K extends keyof EventMap>(event: K, data: MoveParams) {
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
    if (isUndefined(options)) {
      return
    }
    Object.assign(opt, options)
    options.direction && setDirection(options.direction)
  }

  function enable() {
    tar.enable()
  }

  function disable() {
    tar.disable()
  }

  return {
    every,
    setTarget,
    getTarget,
    setDirection,
    on,
    once,
    updateOption,
    enable,
    disable,
  }
}
