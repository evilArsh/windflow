import { ProviderMeta, SettingKeys } from "@renderer/types"
import { defineStore } from "pinia"
import { providerDefault } from "./default/provider.default"
import { ProviderManager } from "@renderer/lib/provider"
import { db } from "@renderer/usable/useDatabase"
import { useThrottleFn } from "@vueuse/core"
import { providerSvgIconKey } from "@renderer/app/element/usable/useSvgIcon"
import { IconifyJSON } from "@iconify/types"
import { getIconHTML } from "@renderer/components/SvgPicker"
import { Reactive } from "vue"
import { Settings } from "@renderer/types"
const useData = (metas: Reactive<Record<string, ProviderMeta>>, currentProvider: Ref<ProviderMeta | undefined>) => {
  const providerSvgIcon = inject(providerSvgIconKey)
  const defaultLogo = getIconHTML(providerSvgIcon as IconifyJSON, "default")
  const userLogo = getIconHTML(providerSvgIcon as IconifyJSON, "user")
  const update = useThrottleFn(async (data: ProviderMeta) => db.providerMeta.update(data.name, toRaw(data)), 300, true)
  const add = async (data: ProviderMeta) => await db.providerMeta.add(toRaw(data))

  const fetch = async () => {
    try {
      for (const key in metas) {
        delete metas[key]
      }
      const defaultData = providerDefault(providerSvgIcon as IconifyJSON)
      const data = await db.providerMeta.toArray()
      data.forEach(item => {
        metas[item.name] = item
      })
      for (const item of defaultData) {
        if (!metas[item.name]) {
          metas[item.name] = item
          await add(item)
        }
      }
      const current = (await db.settings.get(SettingKeys.ProviderCurrentSettingActive)) as Settings<string> | undefined
      if (current) {
        currentProvider.value = metas[current.value]
      } else if (defaultData.length > 0) {
        currentProvider.value = metas[defaultData[0].name]
      }
    } catch (error) {
      console.error(`[fetch providers] ${(error as Error).message}`)
    }
  }
  const reset = async () => {
    await db.providerMeta.clear()
    await fetch()
  }
  return {
    reset,
    fetch,
    defaultLogo,
    userLogo,
    update,
  }
}
export default defineStore("provider", () => {
  const currentProvider = ref<ProviderMeta>() // 模型页选中的提供商
  const metas = reactive<Record<string, ProviderMeta>>({})
  const manager = markRaw<ProviderManager>(new ProviderManager())

  const api = useData(metas, currentProvider)
  function getProviderLogo(name?: string) {
    if (!name) {
      return api.defaultLogo
    }
    const provider = metas[name]
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
