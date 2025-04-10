<script setup lang="ts">
import { ref } from "vue"
const props = defineProps<{
  ts: number // timestamp
  data: string
  title: string
  confirm: string
  cancel: string
}>()
const emit = defineEmits<{
  (e: "change", data: string): void
}>()
const show = ref(true)
const data = ref(props.data)

watch(
  () => props.ts,
  () => {
    show.value = true
  }
)
watch(
  () => props.data,
  () => {
    data.value = props.data
  }
)
const onConfirm = () => {
  emit("change", data.value)
  show.value = false
}
</script>
<template>
  <el-dialog v-model="show" :title="title" width="70vw" draggable lock-scroll destroy-on-close overflow>
    <div class="w-full h-70vh overflow-hidden">
      <el-scrollbar>
        <el-input v-model="data" type="textarea" autosize resize="none" />
      </el-scrollbar>
    </div>
    <template #footer>
      <div class="flex gap1rem justify-end">
        <el-button type="primary" @click="onConfirm">{{ confirm }}</el-button>
        <el-button @click="show = false">{{ cancel }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
