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
  direction: "t" | "r"
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
        top: px(-toNumber(props.size) / 2),
        left: 0,
        right: 0,
        cursor: "ns-resize",
      }
    case "r":
      return {
        width: px(props.size),
        top: 0,
        bottom: 0,
        right: px(-toNumber(props.size) / 2),
        cursor: "ew-resize",
      }
    default:
      return {}
  }
})
const iconStyle = computed<CSSProperties>(() => {
  return {
    transform: props.direction == "t" ? "rotate(90deg)" : "rotate(0deg)",
  }
})
on(ScaleEv.SCALING, () => {
  emit("update:modelValue", {
    width: getValue("width", scaleConfig.value.containerStyle?.width),
    height: getValue("height", scaleConfig.value.containerStyle?.height),
  })
})
on(ScaleEv.AFTER_SCALE, () => {
  emit("afterScale")
})
onBeforeUnmount(() => {
  dispose()
})
</script>
<template>
  <div class="resize-handler" :style="handlerStyle" @mousedown="onMouseDown($event, props.direction)">
    <i-material-symbols-light:drag-indicator
      class="resize-handler-icon"
      :style="iconStyle"></i-material-symbols-light:drag-indicator>
  </div>
</template>
<style lang="scss" scoped>
.resize-handler {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  &:hover {
    opacity: 1;
  }
}
.resize-handler-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
  z-index: 10;
}
</style>
