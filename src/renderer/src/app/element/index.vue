<script setup lang="ts">
import zhCn from "element-plus/es/locale/lang/zh-cn"
// import useProviderStore from "@renderer/store/provider.store"
// import useModelStore from "@renderer/store/model.store"
// import { ElLoading } from "element-plus"
// const providerStore = useProviderStore()
// const modelStore = useModelStore()
// async function init() {
//   const loading = ElLoading.service({
//     fullscreen: true,
//     text: "加载中...",
//   })
//   try {
//     await Promise.all([providerStore.fetch(), modelStore.fetch()])
//   } catch (error) {
//     console.error(`[init] ${(error as Error).message}`)
//   } finally {
//     loading.close()
//   }
// }
// init()
</script>
<template>
  <el-config-provider :locale="zhCn">
    <router-view></router-view>
  </el-config-provider>
</template>
