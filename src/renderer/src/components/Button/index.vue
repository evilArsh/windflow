<template>
  <el-button v-bind="$attrs" :disabled="disabled" :loading="loading" aria-label="ep-button" @click.stop="onClick">
    <slot>load</slot>
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
<style scoped lang="scss"></style>
