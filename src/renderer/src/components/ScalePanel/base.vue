<template>
  <div
    ref="drag"
    class="dragContainer"
    :id="props.modelValue.containerId ?? undefined"
    :style="[useContainerStyle, useContainerTranslate]"
    :aria-label="config.name">
    <div v-if="withDefaultHeader" class="dragHeader" :style="useHeaderStyle">
      <div ref="headerLeftOuter" class="left">
        <div ref="headerLeft" class="leftInner">
          <p>{{ config.name }}</p>
        </div>
      </div>
      <div ref="headerRight" class="right">
        <slot v-if="withDefaultToolbar" name="toolbar" :config :scale :move :drag-offset></slot>
      </div>
    </div>
    <slot v-if="config.scalable" name="resize" :config :scale :move></slot>
    <div ref="scales" class="scaleContent" :style="useContentStyle">
      <slot></slot>
    </div>
    <Teleport to="body" :disabled="!config.mask">
      <div class="dragMask" :style="useMaskStyle" @click="emit('maskClick')"></div>
    </Teleport>
  </div>
</template>
<script lang="ts" setup>
import { type MoveType, useMove } from "@renderer/lib/drag"
import type { CSSProperties } from "@renderer/lib/shared/types"
import { type ScaleConfig, ScalePropsBase, BaseMountedParams, MoveEvent, DragOffset } from "./types"
import { getValue, px, toNumber } from "@renderer/lib/shared/styles"
import useScale, { ScaleEv } from "./useScale"
import { useComputedStyle, useDragOffset, useStatusListener, useStyleHandler, values } from "./helper"
import { type Ref } from "vue"
const emit = defineEmits<{
  moving: [pos: MoveEvent]
  beforeMove: [pos: MoveEvent]
  afterMove: [pos: MoveEvent]
  afterScale: [scaleEl: HTMLElement]
  scaling: [scaleEl: HTMLElement]
  mounted: [data: BaseMountedParams]
  maskClick: []
  "update:modelValue": [data: ScaleConfig]
}>()
const props = defineProps<ScalePropsBase>()
const config: Ref<ScaleConfig> = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val),
})
const headerLeftOuterRef = useTemplateRef("headerLeftOuter")
const scaleRef = useTemplateRef("scales")
const dragRef = useTemplateRef("drag")
const move = ref<MoveType>()
const containerStyle = toRef(config.value, "containerStyle")
const contentStyle = toRef(config.value, "contentStyle")
const headerStyle = toRef(config.value, "headerStyle")
const { get: getContainer } = useStyleHandler(containerStyle)
const dragOffset = ref<DragOffset>({
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
const withDefaultHeader = computed(() => !config.value.normal && config.value.defaultHeader)
const withDefaultToolbar = computed(() => config.value.defaultToolbar)

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
  toRef(() => unref(props.target)),
  headerLeftOuterRef
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
async function init() {
  await nextTick()
  initScale()
  initMove()
  setTarget()
  onMovableChange(config.value.movable)
  onNormalChange(config.value.normal)
  emit("mounted", {
    config,
    drag: dragRef,
    content: scaleRef,
    dragOffset,
    move,
    scale,
    handle: undefined,
  } as BaseMountedParams)
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
    .left {
      cursor: move;
      display: flex;
      align-items: center;
      flex: 1;
      height: 100%;
      .leftInner {
        padding: 0 5px;
      }
    }
    .right {
      display: flex;
      align-items: center;
    }
  }
  & > .scaleContent {
    flex: 1;
    overflow: auto;
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
