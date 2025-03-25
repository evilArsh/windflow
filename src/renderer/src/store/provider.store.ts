import { ProviderMeta, ProviderName } from "@renderer/types"
import { defineStore } from "pinia"
import useDataStorage from "@renderer/usable/useDataStorage"
import { providerDefault } from "./default/provider.default"
import { ProviderManager } from "@renderer/lib/provider"
import { useDebounceFn } from "@vueuse/core"

export default defineStore("provider", () => {
  const { save, get } = useDataStorage()
  const SAVE_KEY = "chat.providers"
  const config = reactive<ProviderMeta[]>([])
  const manager = markRaw<ProviderManager>(new ProviderManager())

  function find(name?: ProviderName): ProviderMeta | undefined {
    if (!name) return
    return config.find(v => v.name === name)
  }

  const init = async () => {
    const data = await get<ProviderMeta[]>(SAVE_KEY)
    if (data) {
      config.push(...data)
    } else {
      config.push(...providerDefault())
    }
  }
  watch(
    config,
    useDebounceFn((val: ProviderMeta[]) => save<ProviderMeta[]>(SAVE_KEY, toRaw(val)), 300),
    { deep: true }
  )
  init()
  return {
    find,
    providerConfigs: config,
    providerManager: manager,
  }
})
