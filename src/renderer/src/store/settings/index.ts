import { defineStore } from "pinia"
import { Settings, SettingsValue } from "@renderer/types"
import { useData } from "./data"

export default defineStore("settings", () => {
  const settings = reactive<Record<string, Settings<SettingsValue>>>({})
  const api = useData(settings)
  return {
    api,
    settings,
  }
})
