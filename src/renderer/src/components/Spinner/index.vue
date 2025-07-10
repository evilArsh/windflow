<script lang="ts" setup>
const props = defineProps<{
  modelValue?: boolean
  /**
   * @description 如果为true，则在icon不可视时摧毁元素而不是隐藏透明度
   */
  destroyIcon?: boolean
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
}>()
const show = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit("update:modelValue", value)
  },
})
const existed = computed(() => {
  return show.value ? true : !props.destroyIcon
})
</script>
<template>
  <i-ep:loading v-if="existed" class="spin-element" :class="{ show }"></i-ep:loading>
</template>
<style lang="scss" scoped>
.spin-element {
  --load-visible-color: transparent;
  animation: spin 2s linear infinite;
  transform-origin: center;
  transition: color 0.25s;
  color: var(--load-visible-color);
  &.show {
    --load-visible-color: var(--el-color-primary);
  }
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
