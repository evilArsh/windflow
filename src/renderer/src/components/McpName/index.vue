<script lang="ts" setup>
import { MCPServerParam } from "@shared/types/mcp"
defineProps<{
  data: MCPServerParam
}>()
</script>
<template>
  <div class="flex gap.5rem items-center">
    <el-text class="break-all">{{ data.serverName }}</el-text>
    <ContentBox v-if="data.type === 'stdio'">
      <i-fluent-emoji-flat:desktop-computer class="text-1.2rem"></i-fluent-emoji-flat:desktop-computer>
    </ContentBox>
    <ContentBox v-else>
      <i-fluent-emoji-flat:globe-showing-americas class="text-1.2rem"></i-fluent-emoji-flat:globe-showing-americas>
    </ContentBox>
  </div>
</template>
<style lang="scss" scoped></style>
