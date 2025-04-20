<script setup lang="ts">
import { LLMContent } from "@renderer/types"
import { ref } from "vue"
const props = defineProps<{
  modelValue: boolean
  data?: LLMContent
  title: string
  confirm: string
  cancel: string
}>()
const emit = defineEmits<{
  (e: "change", data: string): void
  (e: "update:modelValue", data: boolean): void
}>()
const visible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val),
})
const data = ref(props.data)
watchEffect(() => {
  if (isString(props.data)) {
    data.value = props.data
  }
})
const onConfirm = () => {
  if (isString(data.value)) {
    emit("change", data.value)
  }
  visible.value = false
}
const onCancel = () => {
  visible.value = false
}
</script>
<template>
  <el-dialog v-model="visible" :title="title" width="70vw" draggable lock-scroll destroy-on-close overflow>
    <div class="w-full h-70vh overflow-hidden">
      <el-scrollbar>
        <el-input v-if="isString(data)" v-model="data" type="textarea" autosize resize="none" />
      </el-scrollbar>
    </div>
    <template #footer>
      <div class="flex gap1rem justify-end">
        <el-button type="primary" @click="onConfirm">{{ confirm }}</el-button>
        <el-button @click="onCancel">{{ cancel }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
