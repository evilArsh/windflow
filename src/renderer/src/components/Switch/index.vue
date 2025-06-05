<script lang="ts" setup>
const props = defineProps<{
  beforeChange?: () => Promise<boolean> | boolean
}>()
const emit = defineEmits<{
  (e: "change", value: boolean | string | number): void
}>()
const loading = ref(false)
const beforeChange = (): boolean | Promise<boolean> => {
  if (props.beforeChange) {
    loading.value = true
    const res = props.beforeChange()
    if (res instanceof Promise) {
      return res.then(res => {
        loading.value = false
        return res
      })
    } else {
      loading.value = res
    }
  }
  return true
}
</script>
<template>
  <el-switch :loading="loading" :before-change="beforeChange" @change="emit('change', $event)" />
</template>
