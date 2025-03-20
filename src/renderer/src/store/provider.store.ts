import { ProviderConfig, ProviderName } from "@renderer/types"
import { defineStore } from "pinia"
import useDataStorage from "@renderer/usable/useDataStorage"
import { merge } from "lodash-es"
import { providerDefault } from "./default/provider.default"
import { ProviderManager } from "@renderer/lib/provider"
import { LLMDeepSeek } from "@renderer/lib/provider/llm/deepseek"
const PROVIDER_NAME_MAP = {
  [ProviderName.DeepSeek]: LLMDeepSeek,
}
export default defineStore("provider", () => {
  const { save, get } = useDataStorage()
  const SAVE_KEY = "chat.providers"
  const defaultProviderId = shallowRef<string>(`provider-${ProviderName.DeepSeek}`) // 默认提供商
  const providersConfig = reactive<ProviderConfig[]>([])
  const providerManager = markRaw<ProviderManager>(new ProviderManager())

  function findById(id: string): ProviderConfig | undefined {
    return providersConfig.find(v => v.id === id)
  }
  const init = async () => {
    const data = await get<ProviderConfig[]>(SAVE_KEY)
    providersConfig.push(...merge(providerDefault(), data))
    providersConfig.forEach(v => {
      if (PROVIDER_NAME_MAP[v.name]) {
        if (!providerManager.getProvider(v.id)) {
          providerManager.setProvider(v.id, new PROVIDER_NAME_MAP[v.name](v))
        } else {
          console.warn("[init provider] duplicate provider, already exists", v)
        }
      }
    })
  }
  watch(providersConfig, () => {
    save<ProviderConfig[]>(SAVE_KEY, toRaw(providersConfig))
  })
  init()
  return {
    providersConfig,
    defaultProviderId,
    findById,
    providerManager,
  }
})
