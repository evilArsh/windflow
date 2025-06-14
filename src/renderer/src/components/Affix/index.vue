<script lang="ts" setup>
import { CSSProperties } from "@renderer/lib/shared/types"
import { useElementBounding, useIntersectionObserver } from "@vueuse/core"

const {
  position = "top",
  target = "",
  offset = 0,
} = defineProps<{
  /**
   * 选择top时,如果元素滚动到[底部]消失或即将消失，会回到原位置
   *
   * 选择bottom时则是滚动到[顶部]时触发
   */
  position?: "top" | "bottom"
  target?: string
  offset?: number
}>()
/**
 * 当前固钉
 */
const affixRef = useTemplateRef("affix")
const affixInner = useTemplateRef("affixInner")
/**
 * 当前固钉包裹的子元素
 */
const childEl = shallowRef<HTMLElement | null>()
const threshold = 1
/**
 * 当前固钉定位时参考元素
 */
const targetEl = shallowRef<HTMLElement | null>()
const { width, height } = useElementBounding(childEl)
const hasTarget = computed(() => !!targetEl.value)
const affixStyle = shallowRef<CSSProperties>({})
const affixScale = shallowRef<CSSProperties>({})
enum Direction {
  Left = "left",
  Right = "right",
  Top = "top",
  Bottom = "bottom",
}
const event = reactive({
  disableTeleport: true,
  target: {
    isIntersecting: false,
    intersectionRatio: 0.0,
    directions: [] as Direction[],
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  },
  affix: {
    isIntersecting: false,
    intersectionRatio: 0.0,
    needFloat: false,
    directions: [] as Direction[],
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  },
})
const update = () => {
  event.affix.needFloat = false
  if (
    event.affix.directions.includes(Direction.Left) ||
    event.affix.directions.includes(Direction.Right) ||
    event.target.directions.includes(Direction.Left) ||
    event.target.directions.includes(Direction.Right)
  ) {
    event.affix.needFloat = false
  } else {
    const nearTop = event.affix.y + event.affix.height / 2 <= window.innerHeight / 2
    if (hasTarget.value) {
      // 【参考元素在相交】并且(【固钉没有相交】或者【相交在指定的阈值内】)
      if (event.target.isIntersecting) {
        if (!event.affix.isIntersecting || event.affix.intersectionRatio < 0.5) {
          event.affix.needFloat = position === Direction.Top ? nearTop : !nearTop
        }
      }
    } else {
      // 没有参考元素的情况下：【固钉没有相交】或者【相交在指定的阈值内】
      if (!event.affix.isIntersecting || event.affix.intersectionRatio < 0.5) {
        event.affix.needFloat = position === Direction.Top ? nearTop : !nearTop
      }
    }
  }

  if (event.affix.needFloat) {
    affixStyle.value = {
      zIndex: 100,
      left: px(event.affix.x),
      [position === Direction.Bottom ? "bottom" : "top"]: px(offset),
    }
    affixScale.value = {
      width: px(width.value),
      height: px(height.value),
    }
  } else {
    affixStyle.value = {}
    affixScale.value = {}
  }
}
function getIntersectDirection(entry: IntersectionObserverEntry, directions: Direction[]) {
  const { boundingClientRect: target, intersectionRect: inter, rootBounds: root } = entry
  if (!root) {
    return
  }
  if (entry.isIntersecting) {
    directions.length = 0
    if (inter.y - target.y > threshold) directions.push(Direction.Top)
    if (target.y - inter.y > threshold) directions.push(Direction.Bottom)
    if (inter.x - target.x > threshold) directions.push(Direction.Left)
    if (target.x + target.width > inter.x + inter.width) directions.push(Direction.Right)
  }
}
const affixOb = useIntersectionObserver(
  affixRef,
  ([entry]) => {
    event.affix.x = entry.boundingClientRect.x
    event.affix.y = entry.boundingClientRect.y
    event.affix.width = entry.boundingClientRect.width
    event.affix.height = entry.boundingClientRect.height
    event.affix.isIntersecting = entry.isIntersecting
    getIntersectDirection(entry, event.affix.directions)
    event.affix.intersectionRatio = entry.intersectionRatio
    update()
  },
  { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }
)
const targetOb = useIntersectionObserver(
  targetEl,
  ([entry]) => {
    event.target.x = entry.boundingClientRect.x
    event.target.y = entry.boundingClientRect.y
    event.target.width = entry.boundingClientRect.width
    event.target.height = entry.boundingClientRect.height
    event.target.isIntersecting = entry.isIntersecting
    getIntersectDirection(entry, event.target.directions)
    event.target.intersectionRatio = entry.intersectionRatio
    update()
  },
  {
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  }
)
function init() {
  childEl.value = affixInner.value?.firstElementChild as HTMLElement | null
  if (target) {
    targetEl.value = document.querySelector(target) as HTMLElement | null
  }
}
onMounted(init)
onBeforeUnmount(() => {
  affixOb.stop()
  targetOb.stop()
})
</script>
<template>
  <div class="comp-affix" :class="{ fix: event.affix.needFloat }" :style="affixScale" ref="affix">
    <div
      ref="affixInner"
      :style="[affixStyle, affixScale]"
      class="comp-affix-inner"
      :class="{ fix: event.affix.needFloat }">
      <slot></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
html.dark {
  .comp-affix.fix {
    --affix-shadow-color: rgba(255, 255, 255, 0.15);
  }
}
.comp-affix {
  --affix-shadow-color: transparent;
  &.fix {
    --affix-shadow-color: rgba(0, 0, 0, 0.1);
  }
  .comp-affix-inner {
    transition: box-shadow 0.3s;
    box-shadow: 0 2px 12px 0 var(--affix-shadow-color);
    border-radius: 1rem;
    &.fix {
      position: fixed;
    }
  }
}
</style>
