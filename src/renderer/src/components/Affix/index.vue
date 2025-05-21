<script lang="ts" setup>
import { CSSProperties } from "@renderer/lib/shared/types"
import { useElementBounding, useIntersectionObserver } from "@vueuse/core"

const props = defineProps<{
  target?: string
  offset?: number
}>()
const affixRef = useTemplateRef("affix")
const affixInner = useTemplateRef("affixInner")
// 当前元素包裹的子元素
const childEl = shallowRef<HTMLElement | null>()
const targetEl = shallowRef<HTMLElement | null>()
const { width, height } = useElementBounding(childEl)
const hasTarget = computed(() => !!targetEl.value)
const affixStyle = shallowRef<CSSProperties>({})
const affixScale = shallowRef<CSSProperties>({})
const event = reactive({
  disableTeleport: true,
  target: {
    isIntersecting: false,
    intersectionRatio: 0.0,
  },
  affix: {
    isIntersecting: false,
    intersectionRatio: 0.0,
    needFloat: false,
  },
})
function update() {
  if (hasTarget.value) {
    event.affix.needFloat =
      (event.target.isIntersecting && !event.affix.isIntersecting) ||
      (event.target.isIntersecting && event.affix.isIntersecting && event.affix.intersectionRatio < 1)
  } else {
    event.affix.needFloat = !event.affix.isIntersecting
  }
  if (event.affix.needFloat) {
    affixStyle.value = {
      top: px(props.offset),
      zIndex: 100,
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
const affixOb = useIntersectionObserver(
  affixRef,
  ([entry]) => {
    event.affix.isIntersecting = entry.isIntersecting
    event.affix.intersectionRatio = entry.intersectionRatio
    update()
  },
  { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }
)
const targetOb = useIntersectionObserver(
  targetEl,
  ([entry]) => {
    event.target.intersectionRatio = entry.intersectionRatio
    event.target.isIntersecting = entry.isIntersecting
    update()
  },
  {
    root: null,
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  }
)
function init() {
  childEl.value = affixInner.value?.firstElementChild as HTMLElement | null
  if (props.target) {
    targetEl.value = document.querySelector(props.target) as HTMLElement | null
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
