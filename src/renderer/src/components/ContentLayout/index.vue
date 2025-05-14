<script lang="ts" setup>
import { useElementBounding } from "@vueuse/core"
import { CSSProperties } from "@renderer/lib/shared/types"

const emit = defineEmits<{
  (e: "scroll", x: number, y: number): void
  (e: "update:handlerHeight", height: number): void
}>()

const { handlerHeight = 0 } = defineProps<{
  handlerHeight?: string | number
}>()

const scaleRef = useTemplateRef("scale")
const scrollRef = useTemplateRef("scroll")
const shouldAutoScroll = ref(true)
const threshold = 50
// el-scrollbar 有三层
//  1. 第二层 scrollRef.value?.wrapRef 高度为视口高度
//  3. 第三层 id="scroll-view"设置到该层，scrollRef.value?.wrapRef.firstChild
//     为完整高度，包含隐藏部分
//  4. 为第四层 div.content--inner
const { height } = useElementBounding(() => scrollRef.value?.wrapRef?.firstChild as HTMLElement)
const scrollHdl = {
  toBottom: (be: ScrollBehavior) => {
    scrollHdl.to(height.value, be)
  },
  to: (y: number, be: ScrollBehavior) => {
    scrollRef.value?.wrapRef?.scrollTo({
      top: y,
      behavior: be,
    })
  },
}
const isNearBottom = () => {
  if (!scrollRef.value?.wrapRef) return false
  const el = scrollRef.value.wrapRef
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
}

const handleScroll = (pos: { scrollTop: number; scrollLeft: number }) => {
  emit("scroll", pos.scrollLeft, pos.scrollTop)
  shouldAutoScroll.value = isNearBottom()
}
const scrollIfShould = (be: ScrollBehavior = "smooth") => {
  if (shouldAutoScroll.value) {
    scrollHdl.toBottom(be)
  }
}

const handlerStyle = ref<CSSProperties>({
  height: px(toNumber(handlerHeight)),
})

const onAfterScale = () => {
  scrollRef.value?.update()
}

watch(
  () => handlerHeight,
  v => {
    if (v) {
      handlerStyle.value.height = px(toNumber(v))
    }
  }
)

watch(
  () => handlerStyle.value.height,
  v => {
    if (v) {
      emit("update:handlerHeight", toNumber(v))
    }
  }
)

defineExpose({
  scrollToBottom: scrollHdl.toBottom,
  scrollTo: scrollHdl.to,
  scrollIfShould,
  updateScroll: () => {
    scrollRef.value?.update()
  },
})
</script>

<template>
  <div class="content-container">
    <div v-if="$slots.header" class="content-header">
      <slot name="header"></slot>
    </div>
    <div class="content-main">
      <slot v-if="$slots.contentLeft" name="contentLeft"></slot>
      <el-scrollbar ref="scroll" style="flex: 1" id="scroll-view" @scroll="handleScroll">
        <div class="content--inner">
          <slot></slot>
        </div>
      </el-scrollbar>
      <slot v-if="$slots.contentRight" name="contentRight"></slot>
    </div>
    <div v-if="$slots.handler" ref="scale" class="content-handler" :style="handlerStyle">
      <Resize v-model="handlerStyle" @after-scale="onAfterScale" size="8px" direction="t" :target="scaleRef" />
      <slot name="handler"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content-container {
  --content-container-bg-color: #ffffff;
  --content-bg-color: transparent;
  --content-header-bg-color: transparent;
  --content-header-height: 4rem;
  --content-handler-bg-color: #f6f6f7;
  --content-handler-border-color: #d9d9d9;

  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--content-container-bg-color);
  .content-header {
    position: relative;
    z-index: 200;
    flex-shrink: 0;
    display: flex;
    flex-basis: var(--content-header-height);
    background-color: var(--content-header-bg-color);
    border-bottom: 1px solid var(--content-handler-border-color);
  }
  .content-main {
    flex: 1;
    background-color: var(--content-bg-color);
    overflow: hidden;
    display: flex;
    &--inner {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }
  }
  .content-handler {
    flex-shrink: 0;
    position: relative;
    display: flex;
    background-color: var(--content-handler-bg-color);
    border-top: 1px solid var(--content-handler-border-color);
    padding: 1rem;
    min-height: 15rem;
  }
}
</style>
