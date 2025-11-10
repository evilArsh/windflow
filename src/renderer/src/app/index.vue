<script setup lang="ts">
import zhCn from "element-plus/es/locale/lang/zh-cn"
import enUs from "element-plus/es/locale/lang/en"
import useProviderStore from "@renderer/store/provider"
import useModelsStore from "@renderer/store/model"
import useChatTopicStore from "@renderer/store/chat"
import useMCPStore from "@renderer/store/mcp"
import useEnvStore from "@renderer/store/env"
import useKnowledgeStore from "@renderer/store/knowledge"
import useEmbeddingStore from "@renderer/store/embedding"
import useSettingsStore from "@renderer/store/settings"
import { ElNotification } from "element-plus"
import { errorToText } from "@toolmain/shared"
const ready = ref(false)
const { t, locale } = useI18n()
const epLocale = computed(() => (locale.value === "zh" ? zhCn : enUs))

async function init() {
  try {
    const res = await Promise.allSettled([
      useSettingsStore().init(),
      useProviderStore().init(),
      useModelsStore().init(),
      useChatTopicStore().init(),
      useMCPStore().init(),
      useEnvStore().init(),
      useKnowledgeStore().init(),
      useEmbeddingStore().init(),
      useEmbeddingStore().init(),
    ])
    res.forEach(r => {
      if (r.status === "rejected") {
        ElNotification({ title: t("tip.initError"), message: errorToText(r.reason), duration: 5000, type: "error" })
      }
    })
  } catch (error) {
    ElNotification({ title: t("tip.initError"), message: errorToText(error), duration: 5000, type: "error" })
  } finally {
    ready.value = true
  }
}
onMounted(init)
</script>
<template>
  <el-config-provider :locale="epLocale">
    <router-view v-if="ready"></router-view>
    <div v-else class="flex justify-center items-center h-100vh w-100vw">
      <el-empty :description="t('tip.loading')"></el-empty>
    </div>
  </el-config-provider>
</template>
