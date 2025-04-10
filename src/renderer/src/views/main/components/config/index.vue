<script lang="ts" setup>
import Wrapper from "./wrapper.vue"
defineProps<{
  modelValue: string[]
}>()
defineEmits<{
  (e: "update:modelValue", value: string[]): void
}>()
</script>
<template>
  <Wrapper> </Wrapper>
</template>
<style lang="scss" scoped>
@use "./style.scss";
</style>
