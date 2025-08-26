import { ProviderMeta } from "@renderer/types"
import { defineStore } from "pinia"
import { ProviderManager } from "@renderer/provider"
import { useData } from "./data"

export default defineStore("provider", () => {
  const currentProvider = ref<ProviderMeta>() // 模型页选中的提供商
  const metas = reactive<Record<string, ProviderMeta>>({})
  const manager = markRaw<ProviderManager>(new ProviderManager())

  const api = useData(metas, currentProvider)
  function getProviderLogo(providerName?: string) {
    if (!providerName) {
      return api.defaultLogo
    }
    const provider = metas[providerName]
    return provider?.logo || api.userLogo
  }
  return {
    getProviderLogo,
    providerMetas: metas,
    providerManager: manager,
    currentProvider,
    api,
  }
})
