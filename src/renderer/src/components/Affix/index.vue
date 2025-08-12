<script lang="ts" setup>
import { CSSProperties } from "@renderer/lib/shared/types"
import { useElementBounding, useIntersectionObserver, useThrottleFn } from "@vueuse/core"

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
const threshold = 2
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
  },
  affix: {
    isIntersecting: false,
    intersectionRatio: 0.0,
    needFloat: false,
    directions: [] as Direction[],
  },
})
const {
  x: affixX,
  y: affixY,
  // width: affixWidth,
  height: affixHeight,
  update: updateAffixBounding,
} = useElementBounding(affixRef)
const needRecalc = () => {
  // 有参考元素
  if (hasTarget.value) {
    // 【参考元素可视】并且(【固钉不可视】或者【部分可视】)
    if (event.target.isIntersecting) {
      if (!event.affix.isIntersecting || event.affix.intersectionRatio < 0.5) {
        return true
      }
    }
  } else {
    // 没有参考元素的情况下：【固钉不可视】或者【部分可视】
    if (!event.affix.isIntersecting || event.affix.intersectionRatio < 0.5) {
      return true
    }
  }
  return false
}
const update = () => {
  updateAffixBounding()
  event.affix.needFloat = false
  if (
    event.affix.directions.includes(Direction.Left) ||
    event.affix.directions.includes(Direction.Right) ||
    event.target.directions.includes(Direction.Left) ||
    event.target.directions.includes(Direction.Right)
  ) {
    event.affix.needFloat = false
  } else {
    if (needRecalc()) {
      const nearTop = affixY.value + affixHeight.value / 2 <= window.innerHeight / 2
      event.affix.needFloat = position === Direction.Top ? nearTop : !nearTop
    }
  }
  if (event.affix.needFloat) {
    affixStyle.value = {
      zIndex: 100,
      left: px(affixX.value),
      [position === Direction.Bottom ? "bottom" : "top"]: px(offset),
    }
    affixScale.value = {
      minWidth: px(width.value),
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
    if (target.x + target.width - (inter.x + inter.width) > threshold) directions.push(Direction.Right)
  }
}
const affixObCallback: IntersectionObserverCallback = ([entry]) => {
  event.affix.isIntersecting = entry.isIntersecting
  getIntersectDirection(entry, event.affix.directions)
  event.affix.intersectionRatio = entry.intersectionRatio
  update()
}
const targetObCallback: IntersectionObserverCallback = ([entry]) => {
  event.target.isIntersecting = entry.isIntersecting
  getIntersectDirection(entry, event.target.directions)
  event.target.intersectionRatio = entry.intersectionRatio
  update()
}
const affixOb = useIntersectionObserver(affixRef, affixObCallback, {
  root: window.document.documentElement,
  threshold: [0, 0.01, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.99, 1],
})
const targetOb = useIntersectionObserver(targetEl, targetObCallback, {
  root: window.document.documentElement,
  threshold: [0, 0.01, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.99, 1],
})
function init() {
  childEl.value = affixInner.value?.firstElementChild as HTMLElement | null
  if (target) {
    targetEl.value = document.querySelector(target) as HTMLElement | null
  }
  updateAffixBounding()
}
const throttledUpdate = useThrottleFn(update, 250, true)
onMounted(() => {
  init()
  window.addEventListener("resize", throttledUpdate)
})
onBeforeUnmount(() => {
  window.removeEventListener("resize", throttledUpdate)
  affixOb.stop()
  targetOb.stop()
})
defineExpose({
  update: () => {
    if (needRecalc()) {
      update()
    }
  },
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
.comp-affix {
  .comp-affix-inner {
    transition: box-shadow 0.3s;
    border-radius: 1rem;
    &.fix {
      position: fixed;
      box-shadow: var(--el-box-shadow);
      background-color: var(--el-card-bg-color);
    }
  }
}
</style>
