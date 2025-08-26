import { IconifyJSON } from "@iconify/types"
import { providerSvgIconKey } from "@renderer/app/hooks/useSvgIcon"
import { ModelMeta } from "@renderer/types"
import { db } from "@renderer/db"
import { useThrottleFn } from "@vueuse/core"
import { Reactive } from "vue"
import { modelsDefault } from "./default"
import useProviderStore from "@renderer/store/provider"
import { cloneDeep } from "@toolmain/shared"

export const useData = (models: Reactive<ModelMeta[]>) => {
  const providerSvgIcon = inject(providerSvgIconKey)
  const providerStore = useProviderStore()
  const update = useThrottleFn(async (data: ModelMeta) => db.model.put(cloneDeep(data)), 300, true)
  async function refresh(newModels: ModelMeta[]) {
    await db.model.bulkPut(newModels)
    await fetch()
  }
  async function find(modelId?: string) {
    if (!modelId) return
    return db.model.get(modelId)
  }

  const fetch = async () => {
    models.length = 0
    const defaultData = modelsDefault(providerSvgIcon as IconifyJSON)
    const data = await db.model.toArray()
    data.forEach(v => {
      if (!v.icon) {
        v.icon = providerStore.getProviderLogo(v.subProviderName)
      }
      models.push(v)
    })
    for (const v of defaultData) {
      if (!models.find(model => model.id === v.id)) {
        models.push(v)
        await db.model.add(v)
      }
    }
  }
  return {
    fetch,
    update,
    find,
    refresh,
  }
}
