import { getValue } from "@renderer/lib/shared/styles"
import type { CSSProperties } from "@renderer/lib/shared/types"
import { DragOffset, ScaleConfig } from "./types"
import { MoveOptions, MoveType } from "./drag/types"
import { ShallowRef } from "vue"
import type { Ref, MaybeRef, Reactive } from "vue"
import useHandle, { Status } from "./useHandle"
import { useDebounceFn } from "@vueuse/core"
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
export function useDragOffset(data: Reactive<DragOffset>) {
  function getScale() {
    return {
      scaleX: data.scale[0],
      scaleY: data.scale[1],
    }
  }
  function getTranslate() {
    return {
      translateX: data.translateX,
      translateY: data.translateY,
    }
  }
  function setTranslate(x: number, y: number, append?: boolean) {
    data.translateX = append ? data.translateX + x : x
    data.translateY = append ? data.translateY + y : y
  }
  /**
   * 元素移动之前pointer的clientX/Y
   */
  function setPrevClientPos(clientX: number, clientY: number) {
    data.prevClientX = clientX
    data.prevClientY = clientY
  }
  /**
   * 元素移动后的translateX和translateY
   */
  function setPrevTranslate(translateX: number, translateY: number) {
    data.prevTranslateX = translateX
    data.prevTranslateY = translateY
  }
  function getPrevClientPos() {
    return {
      clientX: data.prevClientX,
      clientY: data.prevClientY,
    }
  }
  function getPrevTranslate() {
    return {
      translateX: data.prevTranslateX,
      translateY: data.prevTranslateY,
    }
  }
  function setScale(scaleX: number, scaleY: number) {
    data.scale = [scaleX, scaleY]
  }
  function setNormal() {
    data.scale = [1, 1]
    data.prevClientX = 0
    data.prevTranslateX = 0
    data.prevClientY = 0
    data.prevTranslateY = 0
    data.translateX = 0
    data.translateY = 0
  }
  function setData(newData: DragOffset) {
    Object.assign(data, newData)
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
 * CSSProperties 操作函数
 */
export function useStyleHandler(style: Ref<CSSProperties | undefined>) {
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
  handle: Ref<ReturnType<typeof useHandle> | undefined>,
  dragOffset: Reactive<DragOffset>,
  containerStyle: Ref<CSSProperties | undefined>,
  target: Ref<HTMLElement | null | undefined>,
  defaultTarget: ShallowRef<HTMLDivElement | null>
) {
  const { setNormal, setTranslate, setPrevTranslate } = useDragOffset(dragOffset)
  const { get: getContainer, set: setContainer } = useStyleHandler(containerStyle)
  const position = ref<CSSProperties["position"] | undefined>(toValue(getContainer("position")))
  const autoStick = useDebounceFn(
    async () => {
      if (config.value.autoStick) {
        if (typeof config.value.autoStick === "boolean") {
          await handle.value?.autoStick(true)
        } else {
          await handle.value?.stickTo(config.value.autoStick, true)
        }
      }
    },
    200,
    { maxWait: 1000 }
  )
  function updateTarget() {
    if (move.value) {
      move.value.setTarget(toValue(target) ?? defaultTarget.value ?? null)
    }
  }
  /**
   * 组件渲染后的初始化动作
   */
  function onInit() {
    handle.value?.setStatus(Status.NORMAL)
    onMovableChange(config.value.movable)
    onMoveConfChange(config.value.moveConfig)
    onPositionChange(config.value.x, config.value.y)
    onNormalChange(config.value.normal)
    if (isBoolean(config.value.visible)) {
      onVisibleChange(config.value.visible, false)
    } else {
      handle.value?.hideTo("self", false)
    }
  }
  function onVisibleChange(visible?: boolean, animation?: boolean) {
    if (!isBoolean(visible)) return
    const withOffset = isNumber(config.value.x) || isNumber(config.value.y)
    if (visible) {
      handle.value?.show(animation, withOffset ? { x: config.value.x, y: config.value.y } : "self")
    } else {
      handle.value?.hideTo(withOffset ? { x: config.value.x, y: config.value.y } : "self", animation)
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
      setNormal()
      setContainer("position", "static")
    } else {
      updateTarget()
      setContainer("position", position.value)
    }
  }
  function onMoveConfChange(conf?: MoveOptions | undefined) {
    if (!conf) return
    move.value?.updateOption(conf)
  }
  function onPositionChange(x?: number, y?: number) {
    if (move.value?.isMoving()) return
    if (isNumber(config.value.x) || isNumber(config.value.y)) {
      const transX = toNumber(x)
      const transY = toNumber(y)
      setTranslate(transX, transY)
      setPrevTranslate(transX, transY)
    }
  }
  watch(() => config.value.movable, onMovableChange)
  watch(() => config.value.normal, onNormalChange)
  watch(() => config.value.moveConfig, onMoveConfChange, { deep: true })
  watch(
    () => config.value.visible,
    v => onVisibleChange(v, true)
  )
  watch([() => config.value.x, () => config.value.y], ([x, y]) => onPositionChange(x, y))
  watch(target, () => {
    if (!config.value.normal) {
      updateTarget()
    }
  })
  return {
    autoStick,
    onInit,
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
