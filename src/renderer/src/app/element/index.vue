<script setup lang="ts">
import zhCn from "element-plus/es/locale/lang/zh-cn"
import useProviderStore from "@renderer/store/provider"
import useModelsStore from "@renderer/store/model"
import useChatTopicStore from "@renderer/store/chat"
import useMCPStore from "@renderer/store/mcp"
import useEnvStore from "@renderer/store/env"
import { ElNotification } from "element-plus"
import { errorToText } from "@shared/error"
const ready = ref(false)
async function init() {
  try {
    await Promise.all([
      useProviderStore().api.fetch(),
      useModelsStore().api.fetch(),
      useChatTopicStore().api.fetch(),
      useMCPStore().api.fetch(),
      useEnvStore().api.fetch(),
    ])
  } catch (error) {
    console.error(`[init error]`, error)
    ElNotification({
      title: "init error",
      message: errorToText(error),
      duration: 5,
      type: "error",
    })
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
