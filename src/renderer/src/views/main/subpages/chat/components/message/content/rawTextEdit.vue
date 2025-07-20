<script setup lang="ts">
import useDialog from "@renderer/usable/useDialog"
import { Content } from "@renderer/types"
import { ref } from "vue"
const props = defineProps<{
  data?: Content
}>()
const emit = defineEmits<{
  (e: "change", data: string): void
  (e: "update:modelValue", data: boolean): void
}>()
const { t } = useI18n()
const { dlgProps, dlgEvent, close, open } = useDialog({
  draggable: true,
  lockScroll: true,
  center: false,
  top: "10vh",
  destroyOnClose: true,
  overflow: true,
  width: "70vw",
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
  close()
}
const onCancel = () => {
  close()
}
defineExpose({
  open,
  close,
})
</script>
<template>
  <el-dialog v-bind="dlgProps" v-on="dlgEvent" :title="t('chat.editChat')">
    <div class="w-full h-70vh overflow-hidden">
      <el-scrollbar>
        <el-input v-if="isString(data)" v-model="data" type="textarea" autosize resize="none" />
      </el-scrollbar>
    </div>
    <template #footer>
      <div class="flex justify-end">
        <el-button type="primary" @click="onConfirm">{{ t("btn.confirm") }}</el-button>
        <el-button @click="onCancel">{{ t("btn.cancel") }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
