import { getValue } from "@renderer/lib/shared/styles"
import type { CSSProperties } from "@renderer/lib/shared/types"
import { DragOffset, ScaleConfig, ScaleStyleProps } from "./types"
import { MoveType } from "@renderer/lib/drag/types"
import { ShallowRef } from "vue"
import { uniqueId } from "@renderer/lib/shared/is"
import { z } from "@renderer/lib/shared/zindex"
import { merge } from "lodash"
import type { Ref, MaybeRef } from "vue"
export const values = (style?: CSSProperties): Record<string, string | number | undefined> => {
  if (!style) return {}
  const res: Record<string, any> = {}
  for (const [key, value] of Object.entries(style)) {
    res[key] = getValue(key, value)
  }
  return res
}

/**
 * DragOffset 操作函数
 */
export function useDragOffset(data: Ref<DragOffset>) {
  function getScale() {
    return {
      scaleX: data.value.scale[0],
      scaleY: data.value.scale[1],
    }
  }
  function getTranslate() {
    return {
      translateX: data.value.translateX,
      translateY: data.value.translateY,
    }
  }
  function setTranslate(x: number, y: number, append?: boolean) {
    data.value.translateX = append ? data.value.translateX + x : x
    data.value.translateY = append ? data.value.translateY + y : y
  }
  /**
   * 元素移动之前pointer的clientX/Y
   */
  function setPrevClientPos(clientX: number, clientY: number) {
    data.value.prevClientX = clientX
    data.value.prevClientY = clientY
  }
  /**
   * 元素移动后的translateX和translateY
   */
  function setPrevTranslate(translateX: number, translateY: number) {
    data.value.prevTranslateX = translateX
    data.value.prevTranslateY = translateY
  }
  function getPrevClientPos() {
    return {
      clientX: data.value.prevClientX,
      clientY: data.value.prevClientY,
    }
  }
  function getPrevTranslate() {
    return {
      translateX: data.value.prevTranslateX,
      translateY: data.value.prevTranslateY,
    }
  }
  function setScale(scaleX: number, scaleY: number) {
    data.value.scale = [scaleX, scaleY]
  }
  function setNormal() {
    data.value.scale = [1, 1]
    data.value.prevClientX = 0
    data.value.prevTranslateX = 0
    data.value.prevClientY = 0
    data.value.prevTranslateY = 0
    data.value.translateX = 0
    data.value.translateY = 0
  }
  function setData(newData: DragOffset) {
    data.value = newData
  }

  return {
    setData,
    getTranslate,
    setTranslate,
    getScale,
    setScale,
    setNormal,
    setPrevClientPos,
    getPrevClientPos,
    getPrevTranslate,
    setPrevTranslate,
  }
}

/**
 * ScaleStyleProps 操作函数
 */
export function useStyleHandler(style: Ref<ScaleStyleProps | undefined>) {
  function set<T extends keyof CSSProperties>(key: T, value: CSSProperties[T]) {
    if (!style.value) return
    style.value[key] = value
  }
  function sets<T extends keyof CSSProperties>(data: Record<T, CSSProperties[T]>) {
    for (const [key, value] of Object.entries(data)) {
      set(key as T, value as CSSProperties[T])
    }
  }
  function get<T extends keyof CSSProperties>(key: T): CSSProperties[T] | undefined {
    // return getValue(key, style.value[key])
    if (!style.value) return
    return style.value[key]
  }
  return {
    get,
    set,
    sets,
  }
}

export function useStatusListener(
  config: Ref<ScaleConfig>,
  move: Ref<MoveType | undefined>,
  dragOffset: Ref<DragOffset>,
  containerStyle: Ref<ScaleStyleProps | undefined>,
  target: Ref<HTMLElement | null | undefined>,
  defaultTarget: ShallowRef<HTMLDivElement | null>
) {
  const { setNormal } = useDragOffset(dragOffset)
  const { get: getContainer, set: setContainer } = useStyleHandler(containerStyle)
  const position = ref<CSSProperties["position"] | undefined>(toValue(getContainer("position")))
  function setTarget() {
    if (move.value) {
      move.value.setTarget(unref(target) ?? defaultTarget.value ?? null)
    }
  }
  function onMovableChange(movable?: boolean) {
    if (movable) {
      move.value?.enable()
    } else {
      move.value?.disable()
    }
  }

  function onNormalChange(normal?: boolean) {
    if (normal) {
      move.value?.setTarget()
      position.value = getContainer("position")
      config.value.movable = false
      config.value.scalable = false
      config.value.minimized = false
      config.value.closable = false
      setNormal()
      setContainer("position", "static")
    } else {
      setTarget()
      setContainer("position", position.value)
    }
  }
  watch(
    () => config.value.movable,
    v => onMovableChange(v)
  )
  watch(
    () => config.value.normal,
    v => onNormalChange(v)
  )
  watchEffect(() => {
    if (config.value.moveConfig) {
      move.value?.updateOption(config.value.moveConfig)
    }
  })
  return {
    setTarget,
    onMovableChange,
    onNormalChange,
  }
}

export function useComputedStyle<T extends keyof CSSProperties>(
  elRef: MaybeRef<HTMLElement | null | undefined>,
  key: T
): CSSProperties[T] {
  const el = unref(elRef)
  if (el) {
    const res = window.getComputedStyle(el)
    return res.getPropertyValue(key as unknown as string) as CSSProperties[T]
  }
  return getValue(key, undefined)
}

/**
 * 生成默认配置
 */
export function defaultProps(mergeProps?: ScaleConfig): Required<ScaleConfig> {
  const dst: Required<ScaleConfig> = {
    id: uniqueId(),
    name: "ScalePanel",
    containerId: uniqueId(),
    scalable: true,
    movable: true,
    minimized: true,
    maximized: true,
    defaultHeader: true,
    defaultToolbar: true,
    autoStick: false,
    hideFirst: false,
    minFirst: false,
    maxFirst: false,
    normal: false,
    closable: false,
    attachWindow: false,
    moveConfig: {
      direction: "any",
    },
    headerStyle: {
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      position: "relative",
      width: "100%",
      color: "#333333",
      userSelect: "none",
      fontWeight: "bold",
      backgroundColor: "#c0c0c0",
    },
    contentStyle: {
      position: "relative",
    },
    containerStyle: {
      border: "1px solid #0000001a",
      left: 0,
      top: 0,
      zIndex: z.FIXED,
      position: "fixed",
    },
  }
  return mergeProps ? merge(dst, mergeProps) : dst
}
