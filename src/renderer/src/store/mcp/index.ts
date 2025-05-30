import { MCPEnvironment, MCPServerParam } from "@shared/types/mcp"
import useSettingsStore from "@renderer/store/settings"
import { defineStore } from "pinia"
import { useData } from "./data"
import { defaultEnv } from "./default"
import { SettingKeys } from "@renderer/types"
export default defineStore("mcp", () => {
  const settingsStore = useSettingsStore()

  const servers = reactive<MCPServerParam[]>([])
  const env = reactive<MCPEnvironment>(defaultEnv())
  const api = useData(servers)

  settingsStore.api.dataWatcher<MCPEnvironment>(SettingKeys.MCPEnvironment, env, defaultEnv())
  return {
    servers,
    env,
    api,
  }
})
