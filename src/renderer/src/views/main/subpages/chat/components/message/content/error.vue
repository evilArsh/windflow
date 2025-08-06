<script setup lang="ts">
import { ChatMessage } from "@renderer/types"
const props = defineProps<{
  message: ChatMessage
}>()
const message = computed(() => props.message)
</script>
<template>
  <el-alert class="alert" type="warning" show-icon :closable="false">
    <el-text>
      {{ message.msg }}
    </el-text>
  </el-alert>
</template>
<style lang="scss" scoped>
.alert {
  :deep(.el-alert__content) {
    overflow: hidden;
    word-break: break-word;
  }
}
</style>
