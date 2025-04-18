<script lang="ts" setup>
import { MCPStdioServer } from "@renderer/types"
const props = defineProps<{
  modelValue: MCPStdioServer
}>()
const emit = defineEmits<{
  (e: "update:modelValue", value: MCPStdioServer): void
}>()
const data = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val),
})
</script>
<template>
  <div class="p-1rem">
    <el-form :model="data" label-width="10rem" class="w-full" label-position="top"> </el-form>
  </div>
</template>
