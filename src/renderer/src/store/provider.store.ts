import { ProviderMeta } from "@renderer/types"
import { defineStore } from "pinia"
import { providerDefault } from "./default/provider.default"
import { ProviderManager } from "@renderer/lib/provider"
import { storeKey, useDatabase } from "@renderer/usable/useDatabase"
import { useThrottleFn } from "@vueuse/core"
import { providerSvgIconKey } from "@renderer/app/element/usable/useSvgIcon"
import { IconifyJSON } from "@iconify/types"
import { getIconHTML } from "@renderer/components/SvgPicker"
export default defineStore(storeKey.provider, () => {
  const providerSvgIcon = inject(providerSvgIconKey)
  const defaultLogo = getIconHTML(providerSvgIcon as IconifyJSON, "default")
  const userLogo = getIconHTML(providerSvgIcon as IconifyJSON, "user")
  const currentProvider = ref<ProviderMeta>() // 模型页选中的提供商
  const { getAll, add, put } = useDatabase()
  const metas = reactive<Record<string, ProviderMeta>>({})
  const manager = markRaw<ProviderManager>(new ProviderManager())
  const dbUpdate = useThrottleFn(async (data: ProviderMeta) => await put("provider", data.name, toRaw(data)), 300, true)

  function getProviderLogo(name?: string) {
    if (!name) {
      return defaultLogo
    }
    const provider = metas[name]
    return provider?.logo || userLogo
  }

  const fetch = async () => {
    try {
      const data = await getAll<ProviderMeta>("provider")
      if (data.length > 0) {
        data.forEach(item => {
          metas[item.name] = item
        })
        currentProvider.value = data[0]
      } else {
        const data = providerDefault(providerSvgIcon as IconifyJSON)
        data.forEach(item => {
          metas[item.name] = item
        })
        currentProvider.value = data[0]
        for (const item of data) {
          add("provider", item)
        }
      }
    } catch (error) {
      console.error(`[fetch providers] ${(error as Error).message}`)
    }
  }
  fetch()
  return {
    dbUpdate,
    getProviderLogo,
    providerMetas: metas,
    providerManager: manager,
    currentProvider,
  }
})
