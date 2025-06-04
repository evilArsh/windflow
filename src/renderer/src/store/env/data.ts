import { SettingKeys } from "@renderer/types"
import { Reactive } from "vue"
import useSettingsStore from "@renderer/store/settings"
import { ToolEnvironment } from "@shared/types/env"
import { defaultEnv } from "@shared/env"
import { cloneDeep } from "lodash-es"

export const useData = (env: Reactive<ToolEnvironment>) => {
  const settingsStore = useSettingsStore()
  const fetch = async () => {
    try {
      const res = await settingsStore.api.get(SettingKeys.ToolEnvironment, defaultEnv())
      Object.assign(env, res.value)
    } catch (error) {
      console.error(`[fetch chat topic] ${(error as Error).message}`)
    }
  }
  settingsStore.api.dataWatcher<ToolEnvironment>(SettingKeys.ToolEnvironment, env, defaultEnv(), data => {
    if (window.api) {
      window.api.mcp.updateEnv(cloneDeep(data))
    }
  })
  return {
    fetch,
  }
}
