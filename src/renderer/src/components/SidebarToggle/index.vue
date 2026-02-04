<script setup lang="ts">
import Core from "./core.vue"
const emit = defineEmits<{
  "update:modelValue": [boolean]
}>()
const props = defineProps<{
  /**
   * @default - left
   */
  position?: "left" | "right"
  modelValue: boolean
  /**
   * teleport `to`
   */
  to?: string
  /**
   * teleport `defer`
   */
  defer?: boolean
  /**
   * teleport `disabled`
   */
  disabled?: boolean
}>()
function onClick() {
  emit("update:modelValue", !props.modelValue)
}
</script>
<template>
  <teleport v-if="to" :to :defer :disabled>
    <Core :position :toggle="modelValue" @click="onClick"></Core>
  </teleport>
  <Core v-else :position :toggle="modelValue" @click="onClick"></Core>
</template>
<style lang="scss" scoped></style>
