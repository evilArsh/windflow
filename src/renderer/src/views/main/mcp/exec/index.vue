<script lang="ts" setup>
import useSettingsStore from "@renderer/store/settings"
import { SettingKeys } from "@windflow/core/types"
import { defaultEnv, ToolEnvironment } from "@windflow/shared"
import Npm from "./components/npm.vue"
import Python from "./components/python.vue"
import useEnvStore from "@renderer/store/env"
import { cloneDeep } from "@toolmain/shared"
import { storeToRefs } from "pinia"
const settingsStore = useSettingsStore()
const envStore = useEnvStore()
const { env } = storeToRefs(envStore)

envStore.checkEnv()
settingsStore.dataWatcher<ToolEnvironment>(SettingKeys.ToolEnvironment, env, defaultEnv(), data => {
  if (window.api) {
    window.api.mcp.updateEnv(cloneDeep(data))
  }
})
</script>
<template>
  <ContentLayout>
    <div class="flex p-1rem flex-col gap4rem">
      <Npm></Npm>
      <Python></Python>
    </div>
  </ContentLayout>
</template>
<style lang="scss" scoped></style>
