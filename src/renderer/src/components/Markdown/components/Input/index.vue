<script setup lang="ts">
import { DialogPanel } from "@toolmain/components"

const emit = defineEmits<{
  confirm: [string]
  cancel: []
}>()
const props = defineProps<{
  content: string
}>()
const content = ref(props.content)

const { t } = useI18n()
</script>
<template>
  <DialogPanel class="w-full">
    <el-input type="textarea" v-model="content" autosize></el-input>
    <template #footer>
      <el-button type="primary" @click="emit('confirm', content)">{{ t("btn.confirm") }}</el-button>
      <el-button @click="emit('cancel')">{{ t("btn.cancel") }}</el-button>
    </template>
  </DialogPanel>
</template>
<style lang="scss" scoped></style>
