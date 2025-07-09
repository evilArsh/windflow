import { IconifyJSON } from "@iconify/types"
import { providerSvgIconKey } from "@renderer/app/element/usable/useSvgIcon"
import { getIconHTML } from "@renderer/components/SvgPicker"
import { ProviderMeta, SettingKeys } from "@renderer/types"
import { db } from "@renderer/usable/useDatabase"
import { useThrottleFn } from "@vueuse/core"
import { Reactive } from "vue"
import { providerDefault } from "./default"
import { Settings } from "@renderer/types"

export const useData = (
  metas: Reactive<Record<string, ProviderMeta>>,
  currentProvider: Ref<ProviderMeta | undefined>
) => {
  const providerSvgIcon = inject(providerSvgIconKey)
  const defaultLogo = getIconHTML(providerSvgIcon as IconifyJSON, "default")
  const userLogo = getIconHTML(providerSvgIcon as IconifyJSON, "user")
  const update = useThrottleFn(async (data: ProviderMeta) => db.providerMeta.update(data.name, toRaw(data)), 300, true)
  const add = async (data: ProviderMeta) => await db.providerMeta.add(toRaw(data))

  const fetch = async () => {
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
