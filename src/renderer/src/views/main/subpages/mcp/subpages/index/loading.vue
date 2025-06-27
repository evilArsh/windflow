<script lang="ts" setup>
import { MCPServerParam } from "@shared/types/mcp"
const { t } = useI18n()
defineProps<{ server: MCPServerParam }>()
</script>
<template>
  <div class="flex-1 flex flex-col items-center pt-20rem gap-1rem">
    <div class="flex items-center gap-1rem">
      <i-svg-spinners:8-dots-rotate class="text-1.6rem"></i-svg-spinners:8-dots-rotate>
      <el-text>{{ t("mcp.service.connecting", { service: server.name }) }}</el-text>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
