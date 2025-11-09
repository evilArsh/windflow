<script setup lang="ts">
import { ChatMessageTree } from "@renderer/types"
const props = defineProps<{
  message: ChatMessageTree
}>()
const message = computed(() => props.message.node)
</script>
<template>
  <el-alert v-if="message.msg" class="alert" type="warning" show-icon :closable="false">
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
