<script lang="ts" setup>
import { MCPServerParam } from "@windflow/shared"
defineProps<{
  data: MCPServerParam
  hideFlag?: boolean
}>()
</script>
<template>
  <div class="flex gap.5rem items-center">
    <el-text class="break-all">{{ data.label }}</el-text>
    <ContentBox v-if="!hideFlag">
      <i-fluent-emoji-flat-desktop-computer
        v-if="data.type === 'stdio'"
        class="text-1.2rem"></i-fluent-emoji-flat-desktop-computer>
      <i-fluent-emoji-flat-globe-showing-americas
        v-else
        class="text-1.2rem"></i-fluent-emoji-flat-globe-showing-americas>
    </ContentBox>
    <slot></slot>
  </div>
</template>
<style lang="scss" scoped></style>
