<template>
  <div
    ref="drag"
    class="dragContainer"
    :id="modelValue.containerId ?? undefined"
    :style="[useContainerStyle, useContainerTranslate]">
    <div v-if="withHeader" ref="header" class="dragHeader" :style="useHeaderStyle">
      <slot name="header"></slot>
    </div>
    <Resize v-if="config.scalable" :config :scale :move></Resize>
    <div ref="scales" class="scaleContent" :style="useContentStyle">
      <slot></slot>
    </div>
    <Teleport to="body" :disabled="!config.mask">
      <div class="dragMask" :style="useMaskStyle" @click="emit('maskClick')"></div>
    </Teleport>
  </div>
</template>
<script lang="ts" setup>
import { type MoveType, useMove } from "./drag"
import Resize from "./resize.vue"
import type { CSSProperties } from "@renderer/lib/shared/types"
import useHandle, { Status } from "./useHandle"
import { ScaleConfig, ScaleProps, MoveEvent, DragOffset } from "./types"
import { getValue, px, toNumber } from "@renderer/lib/shared/styles"
import useScale, { ScaleEv } from "./useScale"
import { useComputedStyle, useDragOffset, useStatusListener, useStyleHandler, values } from "./helper"
import { type Ref } from "vue"
const emit = defineEmits<{
  beforeMove: [pos: MoveEvent]
  moving: [pos: MoveEvent]
  afterMove: [pos: MoveEvent]
  scaling: [scaleEl: HTMLElement]
  afterScale: [scaleEl: HTMLElement]
  maskClick: []
  "update:modelValue": [data: ScaleConfig]
}>()
const { modelValue, target } = defineProps<ScaleProps>()
const handle: Ref<ReturnType<typeof useHandle> | undefined> = ref()
const config: Ref<ScaleConfig> = computed({
  get: () => modelValue,
  set: val => emit("update:modelValue", val),
})
const headerRef = useTemplateRef("header")
const scaleRef = useTemplateRef("scales")
const dragRef = useTemplateRef("drag")
const move = shallowRef<MoveType>()
const containerStyle = toRef(config.value, "containerStyle")
const contentStyle = toRef(config.value, "contentStyle")
const headerStyle = toRef(config.value, "headerStyle")
const { get: getContainer } = useStyleHandler(containerStyle)
const dragOffset = reactive<DragOffset>({
  prevClientX: 0,
  prevClientY: 0,
  prevTranslateX: 0,
  prevTranslateY: 0,
  translateX: 0,
  translateY: 0,
  scale: [0, 0],
})
const { getScale, getTranslate, setTranslate, setPrevClientPos, getPrevClientPos, setPrevTranslate, getPrevTranslate } =
  useDragOffset(dragOffset)
const scale = useScale({
  config,
  targetEle: dragRef,
})
const targetRef = computed(() => unref(target))
const withHeader = computed(() => !!config.value.header)
const useContentStyle = computed<CSSProperties>(() => values(contentStyle.value))
const useHeaderStyle = computed<CSSProperties>(() => values(headerStyle.value))
const useContainerStyle = computed<CSSProperties>(() => values(containerStyle.value))
const useContainerTranslate = computed<CSSProperties>(() => {
  const { scaleX, scaleY } = getScale()
  const { translateX, translateY } = getTranslate()
  const width = getContainer("width") ?? useComputedStyle(dragRef, "width")
  const height = getContainer("height") ?? useComputedStyle(dragRef, "height")
  return {
    transform: `scale(${scaleX},${scaleY}) translate(${px(translateX)},${px(translateY)})`,
    zIndex: config.value.normal ? undefined : getValue("zIndex", getContainer("zIndex")),
    // 计算其transform中心点，用于优化动画效果。元素移动时，其left和top并没有发生变化
    transformOrigin: `${px(parseFloat((translateX + toNumber(width) / 2).toFixed(2)))}
    ${px(parseFloat((translateY + toNumber(height) / 2).toFixed(2)))}`,
  }
})
const useMaskStyle = computed<CSSProperties>(() => values(config.value.maskStyle))
const { setTarget, onMovableChange, onNormalChange } = useStatusListener(
  config,
  move,
  dragOffset,
  containerStyle,
  targetRef,
  headerRef
)
function initMove() {
  move.value = useMove()
  move.value.every("beforemove", pos => {
    setPrevClientPos(pos.clientX, pos.clientY)
    emit("beforeMove", Object.assign({}, pos, getTranslate()))
  })
  move.value.every("moving", pos => {
    const { clientX, clientY } = getPrevClientPos()
    const { translateX, translateY } = getPrevTranslate()
    setTranslate(translateX + pos.clientX - clientX, translateY + pos.clientY - clientY)
    emit("moving", Object.assign({}, pos, getTranslate()))
  })
  move.value.every("aftermove", async pos => {
    const { translateX, translateY } = getTranslate()
    setPrevTranslate(translateX, translateY)
    emit("afterMove", Object.assign({}, pos, { translateX, translateY }))
  })
}
function initScale() {
  scale.on(ScaleEv.AFTER_SCALE, async () => {
    if (scaleRef.value) emit("afterScale", scaleRef.value)
  })
  scale.on(ScaleEv.SCALING, async () => {
    if (scaleRef.value) emit("scaling", scaleRef.value)
  })
}
function initHandle() {
  handle.value = useHandle({
    config,
    targetEle: dragRef,
    dragOffset,
  })
}
async function init() {
  initScale()
  initMove()
  initHandle()
  setTarget()
  onMovableChange(config.value.movable)
  onNormalChange(config.value.normal)
}
onMounted(init)
onBeforeUnmount(() => {
  scale.dispose()
})
</script>
<style lang="scss" scoped>
.dragContainer {
  display: flex;
  flex-direction: column;
  transform-origin: 0 0;
  & > .dragHeader {
    flex-shrink: 0;
    display: flex;
  }
  & > .scaleContent {
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
  }
}
.dragMask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100;
}
</style>
