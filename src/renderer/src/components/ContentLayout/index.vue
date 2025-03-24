<script lang="ts" setup>
import { useElementBounding, useScroll } from "@vueuse/core"
const emit = defineEmits<{
  (e: "scroll", x: number, y: number): void
}>()
const { handlerHeight = 0 } = defineProps<{
  handlerHeight?: string | number
}>()

const scrollView = shallowRef<HTMLElement | null>()
const scrollViewParent = shallowRef<HTMLElement | null>()
const behavior = ref<ScrollBehavior>("smooth")
const { height } = useElementBounding(scrollView)
const { x, y, isScrolling, arrivedState } = useScroll(scrollViewParent, {
  behavior: () => behavior.value,
})

const scrollToBottom = (be: ScrollBehavior) => {
  behavior.value = be
  setTimeout(() => {
    y.value = height.value * 2 // gurantee
  }, 0)
}
watchEffect(() => {
  emit("scroll", x.value, y.value)
})
onMounted(() => {
  const el = document.getElementById("scroll-view")
  scrollView.value = el
  scrollViewParent.value = el?.parentElement
})
defineExpose({
  scrollToBottom,
  isScrolling: () => !!isScrolling.value,
  arrivedState: () => arrivedState,
  currentY: () => y.value,
  scrollTo: (be: ScrollBehavior, newY: number) => {
    behavior.value = be
    y.value = newY
  },
})
</script>
<template>
  <div class="content-container">
    <div v-if="$slots.header" class="content-header">
      <slot name="header"></slot>
    </div>
    <div class="content">
      <el-scrollbar id="scroll-view">
        <div class="content--inner" ref="scroll">
          <slot></slot>
        </div>
      </el-scrollbar>
    </div>
    <div v-if="$slots.handler" class="content-handler" :style="{ height: handlerHeight }">
      <slot name="handler"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.content-container {
  --content-container-bg-color: #ffffff;
  --content-bg-color: transparent;
  --content-header-bg-color: transparent;
  --content-handler-bg-color: #f6f6f7;
  --content-handler-border-color: #d9d9d9;

  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--content-container-bg-color);
  .content-header {
    flex-shrink: 0;
    display: flex;
    padding: 0.5rem;
    background-color: var(--content-header-bg-color);
  }
  .content {
    flex: 1;
    background-color: var(--content-bg-color);
    overflow: hidden;
    padding: 0.5rem;
    &--inner {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }
  }
  .content-handler {
    flex-shrink: 0;
    display: flex;
    background-color: var(--content-handler-bg-color);
    padding: 1rem;
    margin: 1rem;
    border-radius: 1rem;
    border: solid 1px var(--content-handler-border-color);
  }
}
</style>
