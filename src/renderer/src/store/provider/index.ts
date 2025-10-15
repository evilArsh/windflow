import { ProviderMeta, SettingKeys } from "@renderer/types"
import useSettingsStore from "@renderer/store/settings"
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
  const settingsStore = useSettingsStore()
  const currentProvider = ref<ProviderMeta>() // 模型页选中的提供商
  const metas = reactive<Record<string, ProviderMeta>>({})
  const manager = markRaw<ProviderManager>(new ProviderManager())

  const api = useData()
  function getProviderLogo(providerName?: string) {
    if (!providerName) {
      return defaultLogo
    }
    const provider = metas[providerName]
    return provider?.logo || userLogo
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
    const current = await settingsStore.get<string>(SettingKeys.ProviderCurrentSettingActive, "")
    if (current) {
      currentProvider.value = metas[current.value]
    } else if (defaultData.length > 0) {
      currentProvider.value = metas[defaultData[0].name]
    }
  }
  async function reset() {
    await api.clear()
    return init()
  }
  return {
    init,

    getProviderLogo,
    providerMetas: metas,
    providerManager: manager,
    currentProvider,
    api,
    reset,
  }
})
