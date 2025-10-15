import { ModelMeta } from "@renderer/types"
import { providerSvgIconKey } from "@renderer/app/hooks/useSvgIcon"
import useProviderStore from "@renderer/store/provider"
import { defineStore } from "pinia"
import { useData } from "./api"
import { useUtils } from "./utils"
import { IconifyJSON } from "@iconify/types"
import { modelsDefault } from "./default"
export default defineStore("model", () => {
  const providerSvgIcon = inject(providerSvgIconKey)
  const providerStore = useProviderStore()
  const models = reactive<ModelMeta[]>([]) // 所有模型
  const cache: Map<string, ModelMeta> = new Map() // 检索缓存
  const api = useData()
  const utils = useUtils()

  function setModel(newModel: ModelMeta) {
    cache.set(newModel.id, newModel)
    models.push(newModel)
  }

  function find(modelId?: string) {
    if (!modelId) return
    if (cache.has(modelId)) {
      return cache.get(modelId)
    }
    const model = models.find(v => v.id === modelId)
    if (model) {
      cache.set(modelId, model)
    }
    return model
  }
  function findByProvider(name: string): ModelMeta[] {
    return models.filter(v => v.providerName === name)
  }
  async function init() {
    models.length = 0
    const data = await api.fetch()
    const defaultData = modelsDefault(providerSvgIcon as IconifyJSON)
    data.forEach(v => {
      if (!v.icon) {
        v.icon = providerStore.getProviderLogo(v.subProviderName)
      }
      models.push(v)
    })
    for (const v of defaultData) {
      if (!models.find(model => model.id === v.id)) {
        models.push(v)
        await api.add(v)
      }
    }
  }

  return {
    init,

    models,
    setModel,
    find,
    findByProvider,
    api,
    utils,
  }
})
