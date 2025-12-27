import { ToolEnvironment, defaultEnv } from "@windflow/shared"
import { defineStore } from "pinia"
import { CallBackFn } from "@toolmain/shared"
import { cloneDeep } from "@toolmain/shared"
import useSettingsStore from "@renderer/store/settings"
import { SettingKeys } from "@windflow/core/types"

export default defineStore("env", () => {
  const settingsStore = useSettingsStore()
  const env = ref<ToolEnvironment>(defaultEnv())

  async function checkEnv(cb?: CallBackFn) {
    if (window.api.mcp) {
      const res = await window.api.mcp.testEnv(cloneDeep(env.value))
      env.value.bun.status = res.data.bun.status
      env.value.bun.version = res.data.bun.msg ?? ""
      env.value.uv.status = res.data.uv.status
      env.value.uv.version = res.data.uv.msg ?? ""
    }
    cb?.()
  }

  async function init() {
    const res = await settingsStore.get<ToolEnvironment>(SettingKeys.ToolEnvironment)
    if (!res) {
      env.value = defaultEnv()
      await settingsStore.add({
        id: SettingKeys.ToolEnvironment,
        value: env.value,
      })
    }
    if (res) {
      env.value = res.value
    }
    window.api.mcp.updateEnv(cloneDeep(env.value))
  }

  return {
    init,
    env,
    checkEnv,
  }
})
