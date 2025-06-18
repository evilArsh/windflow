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
      <i-svg-spinners:8-dots-rotate class="text-1.6rem"></i-svg-spinners:8-dots-rotate>
      <el-text>{{ t("mcp.service.connecting", { service: server.serverName }) }}</el-text>
    </div>
    <div v-else-if="server.status === MCPClientStatus.Disconnected">
      <el-text>{{ t("mcp.service.disconnected", { service: server.serverName }) }}</el-text>
    </div>
    <div v-else>
      <el-text>{{ server.status }}</el-text>
    </div>
    <el-button type="primary" @click.stop="emit('retry')">{{ t("btn.retry") }}</el-button>
  </div>
</template>
<style lang="scss" scoped></style>
