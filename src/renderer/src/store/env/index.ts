import { ToolEnvironment } from "@shared/types/env"
import useSettingsStore from "@renderer/store/settings"
import { defineStore } from "pinia"
import { defaultEnv } from "./default"
import { SettingKeys } from "@renderer/types"
import { CallBackFn } from "@renderer/lib/shared/types"
export default defineStore("env", () => {
  const settingsStore = useSettingsStore()
  const env = reactive<ToolEnvironment>(defaultEnv())

  async function checkEnv(cb?: CallBackFn) {
    if (window.api.mcp) {
      const res = await window.api.env.testEnv(toRaw(env))
      env.bun.status = res.data.bun.status
      env.bun.version = res.data.bun.msg ?? ""
      env.uv.status = res.data.uv.status
      env.uv.version = res.data.uv.msg ?? ""
    }
    cb?.()
  }

  settingsStore.api.dataWatcher<ToolEnvironment>(SettingKeys.ToolEnvironment, env, defaultEnv())
  return {
    env,
    checkEnv,
  }
})
