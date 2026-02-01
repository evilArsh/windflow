<script lang="ts" setup>
import { CSSProperties, isUndefined, px, toNumber } from "@toolmain/shared"
import { Resize } from "@toolmain/components"
import { useElementBounding } from "@vueuse/core"
const emit = defineEmits<{
  (e: "update:handlerHeight", height: number): void
  (e: "scroll", x: number, y: number): void
  (e: "minHandlerHeightReached", status: boolean): void
}>()

const {
  handlerHeight = 0,
  minHandlerHeight = 0,
  custom = false,
  chatMode = false,
} = defineProps<{
  handlerHeight?: number
  minHandlerHeight?: number
  /**
   * 自定义模式下不预设默认插槽内容
   */
  custom?: boolean
  /**
   * true: 内容反转：flex-direction:column-reverse
   *
   * false: 正常行为，使用el-scrollbar滚动条
   */
  chatMode?: boolean
}>()

const scrollRef = useTemplateRef("scroll")
const scrollElRef = useTemplateRef("scrollEl")
const handlerRef = useTemplateRef("handler")
const { height: realHandlerHeight } = useElementBounding(handlerRef)
const handlerStyle = ref<CSSProperties>({
  height: px(toNumber(handlerHeight)),
})
const handlerMinHeight = ref<CSSProperties>({
  minHeight: px(toNumber(minHandlerHeight)),
})
watch(
  () => handlerHeight,
  v => {
    if (!isUndefined(v)) {
      handlerStyle.value.height = px(toNumber(v))
    }
  }
)
watch(
  () => handlerStyle.value.height,
  v => {
    if (!isUndefined(v)) {
      emit("update:handlerHeight", toNumber(v))
    }
  }
)
watch(
  realHandlerHeight,
  v => {
    if (toNumber(v) <= toNumber(minHandlerHeight)) {
      emit("minHandlerHeightReached", true)
    } else {
      emit("minHandlerHeightReached", false)
    }
  },
  { immediate: true }
)
const height = computed(() => {
  if (chatMode) {
    return toNumber(scrollRef.value?.scrollHeight)
  } else {
    if (scrollElRef.value?.wrapRef?.firstElementChild) {
      return toNumber(scrollElRef.value.wrapRef.firstElementChild?.scrollHeight)
    }
  }
  return 0
})
const scrollHdl = {
  toBottom: (be?: ScrollBehavior) => {
    scrollHdl.to(height.value, be)
  },
  to: (y: number, be?: ScrollBehavior) => {
    setTimeout(() => {
      if (chatMode) {
        scrollRef.value?.scrollTo({
          top: y * 2,
          behavior: be,
        })
      } else {
        scrollElRef.value?.wrapRef?.scrollTo({
          top: y * 2,
          behavior: be,
        })
      }
    }, 0)
  },
  chatModeOnScroll: (e: Event) => {
    const tar = e.target as HTMLElement
    emit("scroll", toNumber(tar.scrollLeft), toNumber(tar.scrollTop))
  },
  onScroll: (x: number, y: number) => {
    emit("scroll", x, y)
  },
}
const onAfterScale = () => {
  scrollElRef.value?.update()
}
defineExpose({
  scrollToBottom: scrollHdl.toBottom,
  scrollTo: scrollHdl.to,
})
onMounted(() => {
  if (chatMode) {
    scrollRef.value?.addEventListener("scroll", scrollHdl.chatModeOnScroll)
  }
})
onBeforeUnmount(() => {
  if (chatMode) {
    scrollRef.value?.removeEventListener("scroll", scrollHdl.chatModeOnScroll)
  }
})
</script>

<template>
  <div class="content-container">
    <div v-if="$slots.header" class="content-header">
      <slot name="header"></slot>
    </div>
    <div class="content-main">
      <slot v-if="$slots.contentLeft" name="contentLeft"></slot>
      <slot v-if="custom"></slot>
      <div v-else-if="chatMode" class="scroll-bar">
        <div ref="scroll" class="scroll-content">
          <div class="w-full flex-1 flex flex-col-reverse justify-end">
            <slot></slot>
          </div>
        </div>
      </div>
      <el-scrollbar v-else ref="scrollEl" style="flex: 1" @scroll="e => scrollHdl.onScroll(e.scrollLeft, e.scrollTop)">
        <slot></slot>
      </el-scrollbar>
      <slot v-if="$slots.contentRight" name="contentRight"></slot>
    </div>
    <div v-if="$slots.handler" ref="handler" class="content-handler" :style="[handlerStyle, handlerMinHeight]">
      <Resize v-model="handlerStyle" @after-scale="onAfterScale" size="8px" direction="top" />
      <slot name="handler"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.scroll-bar {
  flex: 1;
  position: relative;
  display: flex;
  width: 100%;
}
.scroll-content {
  --scrollbar-thumb-color: transparent;
  width: 100%;
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column-reverse;
  &::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb-color);
  }
  &:hover {
    --scrollbar-thumb-color: var(--el-fill-color-darker);
  }
}
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--el-fill-color-dark);
  border-radius: var(--el-border-radius-base);
  .content-header {
    position: relative;
    flex-shrink: 0;
    display: flex;
    flex-basis: var(--ai-header-height);
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
    height: var(--ai-header-height);
  }
  .content-main {
    flex: 1;
    background-color: var(--el-bg-color);
    overflow: hidden;
    display: flex;
    &--inner {
      display: flex;
      flex-direction: column;
      gap: var(--ai-gap-extre-large);
    }
  }
  .content-handler {
    flex-shrink: 0;
    position: relative;
    display: flex;
    background-color: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-light);
    // padding: var(--content-handler-padding);
    // min-height: calc(var(--ai-header-height) + var(--content-handler-padding));
  }
}
</style>
