<template>
  <el-button v-bind="$attrs" :disabled="finalDisabled" aria-label="ep-button" @click.stop="onClick">
    <template v-if="$slots.icon" #icon>
      <slot name="icon"></slot>
    </template>
    <slot v-if="!finalLoading"></slot>
    <el-icon v-else>
      <i class="i-ep-loading loading-icon"></i>
    </el-icon>
  </el-button>
</template>
<script lang="ts" setup>
import { CallBackFn } from "@toolmain/shared"
import { ElButton } from "element-plus"
const emit = defineEmits<(event: "click", done: CallBackFn, e?: MouseEvent) => void>()
const props = defineProps<{
  normal?: boolean
  loading?: boolean
  disabled?: boolean
}>()

const _disabled = ref(false)
const _loading = ref(false)

const finalDisabled = computed(() => props.disabled || _disabled.value)
const finalLoading = computed(() => props.loading || _loading.value)
function done(): void {
  _disabled.value = false
  _loading.value = false
}
function onClick(e?: MouseEvent) {
  if (!props.normal) {
    _disabled.value = true
    _loading.value = true
    emit("click", done, e)
    return
  }
  emit("click", () => {}, e)
}
defineExpose({
  click: onClick,
})
</script>
<style scoped lang="scss">
.loading-icon {
  animation: spin 1s linear infinite;
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
