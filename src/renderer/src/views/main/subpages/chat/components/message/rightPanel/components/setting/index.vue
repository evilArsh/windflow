<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import ShortCut from "./shortcut.vue"

const props = defineProps<{
  modelValue: ChatTopic
}>()
const emit = defineEmits<{
  "update:modelValue": [ChatTopic]
}>()
computed<ChatTopic>({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val),
})
</script>
<template>
  <div class="flex flex-col gap1rem flex-1 overflow-hidden">
    <ShortCut></ShortCut>
  </div>
</template>
<style lang="scss" scoped></style>
