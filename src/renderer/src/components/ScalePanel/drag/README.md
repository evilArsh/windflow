# drag

元素坐标根据鼠标移动预改变，不改变元素本身位置

## Usage

```typescript
import { useMove } from "@renderer/lib/drag"
import { px } from "@renderer/lib/drag/common/styles"
import React from "react"

type ArrMutKeys = "splice" | "push" | "pop" | "shift" | "unshift"
/**
 * 定长数组类型
 */
export type FixedArray<T, L extends number> = Pick<T[], Exclude<keyof T[], ArrMutKeys>> & {
  readonly length: L
  // [I: number]: T
  // [Symbol.iterator]: () => IterableIterator<T>
}
export interface DragOffset {
  x: { old: number; now: number; final: number }
  y: { old: number; now: number; final: number }
  translateX: number
  translateY: number
  scale: FixedArray<number, 2>
}
export const Component = () => {
  const moveRef = React.useRef<HTMLDivElement>(null)
  const move = React.useMemo(() => useMove(), [moveRef])
  const [style, setStyle] = React.useState<Record<string, number | string>>({})
  const dragOffset = React.useRef<DragOffset>({
    x: { old: 0, now: 0, final: 0 },
    y: { old: 0, now: 0, final: 0 },
    translateX: 0,
    translateY: 0,
    scale: [1, 1],
  })
  function updateStyle() {
    const scaleX = dragOffset.current.scale[0]
    const scaleY = dragOffset.current.scale[1]
    const transX = dragOffset.current.translateX
    const transY = dragOffset.current.translateY
    setStyle({
      transform: `scale(${scaleX},${scaleY}) translate(${px(transX)},${px(transY)})`,
    })
  }
  React.useEffect(() => {
    console.log("useEffect")
    move.once("beforemove", pos => {
      dragOffset.current.x.old = pos.clientX
      dragOffset.current.y.old = pos.clientY
      console.log("beforemove")
    })
    move.once("moving", pos => {
      dragOffset.current.translateX = dragOffset.current.x.final + pos.clientX - dragOffset.current.x.old
      dragOffset.current.translateY = dragOffset.current.y.final + pos.clientY - dragOffset.current.y.old
      updateStyle()
    })
    move.once("aftermove", pos => {
      dragOffset.current.x.final = dragOffset.current.translateX
      dragOffset.current.y.final = dragOffset.current.translateY
      dragOffset.current.x.now = pos.x
      dragOffset.current.y.now = pos.y
      updateStyle()
    })
    move.setTarget(moveRef.current!)
  }, [moveRef])
  return (
    <>
      <div>/home/mine</div>
      <div
        ref={moveRef}
        style={style}
        className="absolute cursor-pointer w-200px h-100px bg-red border-1px border-solid">
        移动元素
      </div>
    </>
  )
}
export default Component

```

## Problem

~~1. 如果 direction 为 horizontal，回调的 y 轴无变化，纵向则 x 轴无变化~~
