import { ProviderMeta } from "@renderer/types"
import { defineStore } from "pinia"
import { ProviderManager } from "@renderer/provider"
import { useData } from "./api.js"
import { providerDefault } from "./default"
import { IconifyJSON } from "@iconify/types"
import { providerSvgIconKey } from "@renderer/app/hooks/useSvgIcon"
import { getIconHTML } from "@renderer/components/SvgPicker"

export default defineStore("provider", () => {
  const providerSvgIcon = inject(providerSvgIconKey)
  const defaultLogo = getIconHTML(providerSvgIcon as IconifyJSON, "default")
  const userLogo = getIconHTML(providerSvgIcon as IconifyJSON, "user")
  const metas = reactive<Record<string, ProviderMeta>>({})
  const manager = markRaw<ProviderManager>(new ProviderManager())

  const api = useData()
  function getProviderLogo(providerName?: string) {
    if (!providerName) {
      return defaultLogo
    }
    const provider = metas[providerName]
    return provider?.logo || getIconHTML(providerSvgIcon as IconifyJSON, providerName.toLowerCase()) || userLogo
  }
  async function update(meta: ProviderMeta) {
    return api.update(meta)
  }
  /**
   * find provider meta by providerName in cache
   */
  function findProviderMeta(providerName: string) {
    return metas[providerName]
  }
  async function init() {
    const defaultData = providerDefault(providerSvgIcon as IconifyJSON)
    for (const key in metas) {
      delete metas[key]
    }
    const data = await api.fetch()
    data.forEach(item => {
      metas[item.name] = item
    })
    for (const item of defaultData) {
      if (!metas[item.name]) {
        metas[item.name] = item
        await api.add(item)
      }
    }
  }
  async function reset() {
    await api.clear()
    return init()
  }
  return {
    init,
    getProviderLogo,
    findProviderMeta,
    providerMetas: metas,
    providerManager: manager,
    reset,
    update,
  }
})
