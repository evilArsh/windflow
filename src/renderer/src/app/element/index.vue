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
const { t } = useI18n()
async function init() {
  const res = await Promise.allSettled([
    useProviderStore().api.fetch(),
    useModelsStore().api.fetch(),
    useChatTopicStore().api.fetch(),
    useMCPStore().api.fetch(),
    useEnvStore().api.fetch(),
  ])
  res.forEach(r => {
    if (r.status === "rejected") {
      ElNotification({
        title: "init error",
        message: errorToText(r.reason),
        duration: 5000,
        type: "error",
      })
    }
  })
  ready.value = true
}
init()
</script>
<template>
  <el-config-provider :locale="zhCn">
    <router-view v-if="ready"></router-view>
    <div v-else class="flex justify-center items-center h-100vh w-100vw">
      <el-empty :description="t('btn.loading')"></el-empty>
    </div>
  </el-config-provider>
</template>
