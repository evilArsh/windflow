<script lang="ts" setup>
const { handlerHeight = 0 } = defineProps<{
  handlerHeight?: string | number
}>()
</script>
<template>
  <div class="content-container">
    <div class="content-header"></div>
    <div class="content">
      <el-scrollbar>
        <div class="content--inner">
          <slot name="content"></slot>
        </div>
      </el-scrollbar>
    </div>
    <div class="content-handler" :style="{ height: handlerHeight }">
      <slot name="handler"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.content-container {
  --content-header-height: 4rem;
  --content-header-bg-color: #06d3d3;
  --content-bg-color: #1b8ae4;
  --content-handler-bg-color: #2d51f0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .content-header {
    flex-shrink: 0;
    display: flex;
    padding: 0.5rem;
    height: var(--content-header-height);
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
      gap: 1rem;
    }
  }
  .content-handler {
    flex-shrink: 0;
    display: flex;
    background-color: var(--content-handler-bg-color);
    padding: 0.5rem;
  }
}
</style>
