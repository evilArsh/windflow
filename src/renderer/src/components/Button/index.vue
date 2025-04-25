<template>
  <el-button v-bind="$attrs" :disabled="disabled" aria-label="ep-button" @click.stop="onClick">
    <slot v-if="!loading"></slot>
    <el-icon v-else>
      <i class="i-ep:loading loading-icon"></i>
    </el-icon>
  </el-button>
</template>
<script lang="ts" setup>
import { ElButton } from "element-plus"
import { type CallBackFn } from "@renderer/lib/shared/types"
const emit = defineEmits<(event: "click", done: CallBackFn, e: MouseEvent) => void>()
const props = defineProps<{
  normal?: boolean
}>()

const disabled = ref(false)
const loading = ref(false)
function done(): void {
  disabled.value = false
  loading.value = false
}
function onClick(e: MouseEvent) {
  if (!props.normal) {
    disabled.value = true
    loading.value = true
    emit("click", done, e)
    return
  }
  emit("click", () => {}, e)
}
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
