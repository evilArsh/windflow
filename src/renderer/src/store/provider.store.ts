import { ProviderConfig, ProviderName } from "@renderer/types"
import { defineStore } from "pinia"
import useDataStorage from "@renderer/usable/useDataStorage"
import { merge } from "lodash-es"
import { providerDefault } from "./default/provider.default"
export default defineStore("provider", () => {
  const { save, get } = useDataStorage()
  const SAVE_KEY = "chat.providers"
  const defaultProviderId = shallowRef<string>(`provider-${ProviderName.DeepSeek}`) // 默认提供商
  const providersConfig = reactive<ProviderConfig[]>([])

  function findById(id: string) {
    return providersConfig.find(v => v.id === id)
  }

  onBeforeMount(async () => {
    const data = await get<ProviderConfig[]>(SAVE_KEY)
    merge(providersConfig, providerDefault(), data)
  })
  watch(providersConfig, () => {
    save<ProviderConfig[]>(SAVE_KEY, toRaw(providersConfig))
  })
  return {
    providersConfig,
    defaultProviderId,
    findById,
  }
})
