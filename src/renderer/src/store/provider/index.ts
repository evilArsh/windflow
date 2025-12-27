import { ProviderManager, ProviderMeta } from "@windflow/core/types"
import { defineStore } from "pinia"
import { getIconHTML } from "@renderer/components/SvgPicker"
import { providerDefault, storage } from "@windflow/core/storage"
import { createProviderManager } from "@windflow/core/provider"
import { useSvgIcon } from "@renderer/hooks/useSvgIcon"

export default defineStore("provider", () => {
  const { providerSvgIcon } = useSvgIcon()
  const defaultLogo = getIconHTML(providerSvgIcon, "default")
  const userLogo = getIconHTML(providerSvgIcon, "user")
  const metas = reactive<Record<string, ProviderMeta>>({})
  const manager: ProviderManager = markRaw(createProviderManager())
  function getProviderLogo(providerName?: string) {
    if (!providerName) {
      return defaultLogo
    }
    const provider = metas[providerName]
    return provider?.logo || getIconHTML(providerSvgIcon, providerName.toLowerCase()) || userLogo
  }
  async function update(meta: ProviderMeta) {
    await storage.provider.put(meta)
    if (metas[meta.name]) {
      Object.assign(metas[meta.name], meta)
    }
  }
  /**
   * find provider meta by providerName in cache
   */
  function findProviderMeta(providerName: string) {
    return metas[providerName]
  }
  async function init() {
    const defaultData = providerDefault(providerSvgIcon)
    for (const key in metas) {
      delete metas[key]
    }
    const data = await storage.provider.fetch()
    data.forEach(item => {
      metas[item.name] = item
    })
    for (const item of defaultData) {
      if (!metas[item.name]) {
        metas[item.name] = item
        await storage.provider.add(item)
      }
    }
  }
  async function reset() {
    await storage.provider.clear()
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
