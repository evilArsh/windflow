<script lang="ts" setup>
import { MCPServerParam } from "@windflow/shared"
import { Spinner } from "@toolmain/components"
const { t } = useI18n()
defineProps<{ server: MCPServerParam }>()
</script>
<template>
  <div class="flex-1 flex flex-col items-center pt-20rem gap-1rem">
    <div class="flex items-center gap-1rem">
      <Spinner :model-value="true" class="text-1.6rem"></Spinner>
      <el-text>{{ t("mcp.service.connecting", { service: server.name }) }}</el-text>
    </div>
  </div>
</template>
<style lang="scss" scoped></style>
