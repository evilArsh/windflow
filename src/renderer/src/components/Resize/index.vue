<script lang="ts" setup>
import useScale, { ScaleEv } from "@renderer/components/ScalePanel/useScale"
import type { ScaleConfig } from "@renderer/components/ScalePanel/types"
import { type CSSProperties } from "@renderer/lib/shared/types"
import { getValue } from "@renderer/lib/shared/styles"
const props = defineProps<{
  /**
   * 大小,水平移动时指定为宽度,垂直移动时指定为高度
   */
  size: number | string
  /**
   * 方向
   */
  direction: "t" | "r" | "b" | "l"
  /**
   * 目标元素
   */
  target?: HTMLElement | null
  modelValue: CSSProperties
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: CSSProperties): void
  (e: "afterScale"): void
}>()

const scaleConfig = ref<ScaleConfig>({
  containerStyle: props.modelValue,
})
const { onMouseDown, on, dispose } = useScale({
  config: scaleConfig,
  targetEle: computed<Readonly<HTMLElement | null | undefined>>(() => props.target),
})
const handlerStyle = computed<CSSProperties>(() => {
  switch (props.direction) {
    case "t":
      return {
        height: px(props.size),
        top: 0,
        left: 0,
        right: 0,
        cursor: "ns-resize",
      }
    case "b":
      return {
        height: px(props.size),
        left: 0,
        right: 0,
        bottom: 0,
        cursor: "ns-resize",
      }
    case "r":
      return {
        width: px(props.size),
        top: 0,
        bottom: 0,
        right: 0,
        cursor: "ew-resize",
      }
    case "l":
      return {
        width: px(props.size),
        left: 0,
        top: 0,
        bottom: 0,
        cursor: "ew-resize",
      }
    default:
      return {}
  }
})
const isRight = computed<boolean>(() => props.direction == "r")
const isLeft = computed<boolean>(() => props.direction == "l")
const isTop = computed<boolean>(() => props.direction == "t")
const isBottom = computed<boolean>(() => props.direction == "b")

const barWidth = computed<string>(() => (isRight.value || isLeft.value ? "2px" : "100%"))
const barHeight = computed<string>(() => (isRight.value || isLeft.value ? "100%" : "2px"))
const barRight = computed<string>(() => (isRight.value ? "0" : "unset"))
const barTop = computed<string>(() => (isTop.value ? "0" : "unset"))
const barleft = computed<string>(() => (isLeft.value ? "0" : "unset"))
const barBottom = computed<string>(() => (isBottom.value ? "0" : "unset"))

on(ScaleEv.SCALING, () => {
  emit("update:modelValue", {
    width: getValue("width", scaleConfig.value.containerStyle?.width),
    height: getValue("height", scaleConfig.value.containerStyle?.height),
  })
})
on(ScaleEv.AFTER_SCALE, () => {
  emit("afterScale")
})
onBeforeUnmount(dispose)
</script>
<template>
  <div class="resize-handler" :style="handlerStyle" @mousedown="onMouseDown($event, props.direction)"></div>
</template>
<style lang="scss" scoped>
.resize-handler {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  // background-color: transparent;
  // top: 0;
  // right: 0;
  transition: opacity 0.3s ease;
  &:hover,
  &:active {
    &::before {
      content: "";
      position: absolute;
      width: v-bind(barWidth);
      height: v-bind(barHeight);
      left: v-bind(barleft);
      top: v-bind(barTop);
      bottom: v-bind(barBottom);
      right: v-bind(barRight);
      background-color: var(--el-color-primary);
    }
  }
}
.resize-handler-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
  z-index: 10;
}
</style>
