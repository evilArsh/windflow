import { ProviderMeta } from "@renderer/types"
import { defineStore } from "pinia"
import { providerDefault } from "./default/provider.default"
import { ProviderManager } from "@renderer/lib/provider"
import { db } from "@renderer/usable/useDatabase"
import { useThrottleFn } from "@vueuse/core"
import { providerSvgIconKey } from "@renderer/app/element/usable/useSvgIcon"
import { IconifyJSON } from "@iconify/types"
import { getIconHTML } from "@renderer/components/SvgPicker"
import { Reactive } from "vue"
const useData = (metas: Reactive<Record<string, ProviderMeta>>, currentProvider: Ref<ProviderMeta | undefined>) => {
  const providerSvgIcon = inject(providerSvgIconKey)
  const defaultLogo = getIconHTML(providerSvgIcon as IconifyJSON, "default")
  const userLogo = getIconHTML(providerSvgIcon as IconifyJSON, "user")
  const update = useThrottleFn(async (data: ProviderMeta) => await db.providerMeta.put(toRaw(data)), 300, true)

  const fetch = async () => {
    try {
      const data = await db.providerMeta.toArray()
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
        await db.providerMeta.bulkAdd(data)
      }
    } catch (error) {
      console.error(`[fetch providers] ${(error as Error).message}`)
    }
  }
  fetch()
  return {
    defaultLogo,
    userLogo,
    update,
  }
}
export default defineStore("provider", () => {
  const currentProvider = ref<ProviderMeta>() // 模型页选中的提供商
  const metas = reactive<Record<string, ProviderMeta>>({})
  const manager = markRaw<ProviderManager>(new ProviderManager())

  const { defaultLogo, userLogo, update } = useData(metas, currentProvider)
  function getProviderLogo(name?: string) {
    if (!name) {
      return defaultLogo
    }
    const provider = metas[name]
    return provider?.logo || userLogo
  }
  return {
    getProviderLogo,
    providerMetas: metas,
    providerManager: manager,
    currentProvider,
    api: {
      update,
    },
  }
})
