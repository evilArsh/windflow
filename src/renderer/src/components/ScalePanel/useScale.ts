import type { Ref } from "vue"
import { type ScaleConfig } from "./types"
import { toNumber } from "@renderer/lib/shared/styles"
import useEvent from "@renderer/usable/useEvent"
import { type CallBackFn } from "@renderer/lib/shared/types"
import { useElementBounding } from "@vueuse/core"
import { useStyleHandler } from "./helper"
interface ScalePos {
  l: number
  t: number
  w: number
  h: number
}
export enum ScaleEv {
  SCALING = "scaling",
  AFTER_SCALE = "after_scale",
}
export default (data: { config: Ref<ScaleConfig>; targetEle: Readonly<Ref<HTMLElement | null | undefined>> }) => {
  const containerStyle = toRef(data.config.value, "containerStyle")
  const { set: setContainer, sets: setContainers } = useStyleHandler(containerStyle)

  const ev = useEvent()
  const pointer = ["t", "r", "b", "l", "lt", "rt", "lb", "rb"]
  // const cursor: Record<string, string> = {
  //   "": "",
  //   t: "ns-resize",
  //   r: "ew-resize",
  //   b: "ns-resize",
  //   l: "ew-resize",
  //   lt: "nwse-resize",
  //   rt: "nesw-resize",
  //   lb: "nesw-resize",
  //   rb: "nwse-resize",
  // }
  let dir = ""
  const { x: tx, y: ty, width: tWidth, height: tHeight, update: tUpdate } = useElementBounding(data.targetEle)
  const moveMap: Record<string, (e: MouseEvent, pos: ScalePos) => any> = {
    t: (e: MouseEvent, pos: ScalePos) => {
      if (e.clientY >= target.y + target.height) {
        return
      }
      setContainers({ top: pos.t, height: pos.h })
    },
    r: (_e: MouseEvent, pos: ScalePos) => {
      setContainer("width", pos.w)
    },
    b: (_e: MouseEvent, pos: ScalePos) => {
      setContainer("height", pos.h)
    },
    l: (e: MouseEvent, pos: ScalePos) => {
      if (e.clientX >= target.x + target.width) {
        return
      }
      setContainers({ left: pos.l, width: pos.w })
    },
    lt: (e: MouseEvent, pos: ScalePos) => {
      if (e.clientX >= target.x + target.width || e.clientY >= target.y + target.height) {
        return
      }
      setContainers({ left: pos.l, top: pos.t, width: pos.w, height: pos.h })
    },
    rt: (e: MouseEvent, pos: ScalePos) => {
      if (e.clientY >= target.y + target.height) {
        return
      }
      setContainers({ top: pos.t, width: pos.w, height: pos.h })
    },
    lb: (e: MouseEvent, pos: ScalePos) => {
      if (e.clientX >= target.x + target.width) {
        return
      }
      setContainers({ left: pos.l, width: pos.w, height: pos.h })
    },
    rb: (_e: MouseEvent, pos: ScalePos) => {
      setContainers({ width: pos.w, height: pos.h })
    },
  }
  const target = { x: 0, y: 0, clientX: 0, clientY: 0, left: 0, top: 0, width: 0, height: 0 }
  function onSelectStart(e: Event) {
    e.preventDefault()
  }
  // 锚点移动
  function onGlobalMove(e: MouseEvent) {
    const top = target.top + e.clientY - target.clientY
    const left = target.left + e.clientX - target.clientX
    const width = dir.startsWith("r") ? e.clientX - target.x : target.width + target.clientX - e.clientX
    const height = dir.endsWith("t") ? target.height + target.clientY - e.clientY : e.clientY - target.y
    moveMap[dir](e, {
      l: left,
      t: top,
      w: width,
      h: height,
    })
    ev.emit(ScaleEv.SCALING)
  }
  function onGlobalUp() {
    document.removeEventListener("mouseup", onGlobalUp)
    document.removeEventListener("mousemove", onGlobalMove)
    document.removeEventListener("selectstart", onSelectStart)
    ev.emit(ScaleEv.AFTER_SCALE)
  }
  // 锚点按下
  function onMouseDown(e: MouseEvent, direction: string) {
    document.addEventListener("selectstart", onSelectStart)
    dir = direction
    e.stopPropagation()
    e.preventDefault()
    tUpdate()
    // 记录原始位置
    target.x = tx.value
    target.y = ty.value
    target.clientX = e.clientX
    target.clientY = e.clientY
    target.left = toNumber(data.config.value.containerStyle?.left)
    target.top = toNumber(data.config.value.containerStyle?.top)
    target.width = tWidth.value
    target.height = tHeight.value
    document.addEventListener("mousemove", onGlobalMove)
    document.addEventListener("mouseup", onGlobalUp)
  }
  function on(e: ScaleEv, cb: CallBackFn) {
    ev.on(e, cb)
  }
  function dispose() {
    ev.removeAllListeners()
  }
  function getTarget(): HTMLElement | null | undefined {
    return data.targetEle.value
  }
  return {
    pointer,
    getTarget,
    onMouseDown,
    on,
    dispose,
  }
}
