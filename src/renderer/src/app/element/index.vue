<script setup lang="ts">
import zhCn from "element-plus/es/locale/lang/zh-cn"
import useProviderStore from "@renderer/store/provider.store"
import useModelsStore from "@renderer/store/model.store"
import useChatTopicStore from "@renderer/store/chat.store"
import useMCPStore from "@renderer/store/mcp.store"
const ready = ref(false)
async function init() {
  try {
    await Promise.all([
      useProviderStore().api.fetch(),
      useModelsStore().api.fetch(),
      useChatTopicStore().api.fetch(),
      useMCPStore().api.fetch(),
    ])
  } catch (error) {
    console.error(`[init] ${(error as Error).message}`)
  } finally {
    ready.value = true
  }
}
init()
</script>
<template>
  <el-config-provider :locale="zhCn">
    <router-view v-if="ready"></router-view>
    <div v-else class="flex justify-center items-center h-100vh w-100vw">
      <el-empty description="加载中..."></el-empty>
    </div>
  </el-config-provider>
</template>
