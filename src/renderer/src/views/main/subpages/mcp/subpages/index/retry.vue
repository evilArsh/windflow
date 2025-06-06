<script lang="ts" setup>
import { MCPClientStatus, MCPServerParam } from "@shared/types/mcp"
const { t } = useI18n()
defineProps<{ server: MCPServerParam }>()
const emit = defineEmits<{
  retry: []
}>()
</script>
<template>
  <div class="flex-1 flex flex-col items-center pt-20rem gap-1rem">
    <div v-if="server.status === MCPClientStatus.Connecting" class="flex items-center gap-1rem">
      <i-eos-icons:bubble-loading class="text-1.6rem"></i-eos-icons:bubble-loading>
      <el-text>{{ t("mcp.service.connecting", { service: server.serverName }) }}</el-text>
    </div>
    <div v-else-if="server.status === MCPClientStatus.Disconnected">
      <el-text>{{ t("mcp.service.disconnected", { service: server.serverName }) }}</el-text>
    </div>
    <el-button type="primary" @click.stop="emit('retry')">{{ t("btn.retry") }}</el-button>
  </div>
</template>
<style lang="scss" scoped></style>
