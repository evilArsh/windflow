import { ToolEnvironment } from "@shared/types/env"
import { defineStore } from "pinia"
import { CallBackFn } from "@toolmain/shared"
import { defaultEnv } from "@shared/env"
import { cloneDeep } from "@toolmain/shared"
import useSettingsStore from "@renderer/store/settings"
import { SettingKeys } from "@renderer/types"

export default defineStore("env", () => {
  const settingsStore = useSettingsStore()
  const env = reactive<ToolEnvironment>(defaultEnv())

  async function checkEnv(cb?: CallBackFn) {
    if (window.api.mcp) {
      const res = await window.api.mcp.testEnv(cloneDeep(env))
      env.bun.status = res.data.bun.status
      env.bun.version = res.data.bun.msg ?? ""
      env.uv.status = res.data.uv.status
      env.uv.version = res.data.uv.msg ?? ""
    }
    cb?.()
  }

  async function init() {
    const res = await settingsStore.get(SettingKeys.ToolEnvironment, defaultEnv())
    Object.assign(env, res)
    window.api.mcp.updateEnv(cloneDeep(env))
  }

  return {
    init,

    env,
    checkEnv,
  }
})
