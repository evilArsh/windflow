<script lang="ts" setup>
import { getValue } from "@renderer/lib/shared/styles"
const { width = "300px" } = defineProps<{
  width?: string | number
}>()
const emit = defineEmits<{
  (e: "update:width", val: string): void
}>()
const scaleRef = useTemplateRef("scale")

const handlerStyle = ref<CSSProperties>({
  width,
})
watch(
  () => width,
  val => {
    handlerStyle.value.width = val
  }
)
watch(
  () => handlerStyle.value.width,
  val => {
    emit("update:width", getValue("width", val))
  }
)
</script>
<template>
  <div class="subnav-container">
    <div class="subnav-provider" ref="scale" :style="handlerStyle">
      <slot name="submenu"></slot>
      <Resize v-model="handlerStyle" size="8px" direction="r" :target="scaleRef" />
    </div>
    <div class="subnav-content">
      <slot name="content"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.subnav-container {
  --subnav-container-bg-color: transparent;
  --subnav-provider-bg-color: #efefef;
  --subnav-provider-border-color: #d9d9d9;
  --subnav-provider-padding: 0.25rem;
  --subnav-container-content-bg-color: #fdfdfd;

  flex: 1;
  display: flex;
  overflow: hidden;
  background-color: var(--subnav-container-bg-color);
  .subnav-provider {
    overflow: hidden;
    min-width: 20rem;
    background-color: var(--subnav-provider-bg-color);
    display: flex;
    flex-direction: column;
    padding: var(--subnav-provider-padding);
    border-right: solid 1px var(--subnav-provider-border-color);
    position: relative;
  }
  .subnav-content {
    flex-shrink: 0;
    background-color: var(--subnav-container-content-bg-color);
    overflow: hidden;
    display: flex;
    flex: 1;
  }
}
</style>
