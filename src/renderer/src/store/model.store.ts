import { ModelMeta, ProviderName } from "@renderer/types"
import { defineStore } from "pinia"
import { modelsDefault } from "./default/models.default"
import useDataStorage from "@renderer/usable/useDataStorage"

export default defineStore("model", () => {
  const SAVE_KEY = "models"
  const { save, get } = useDataStorage()
  const models = reactive<ModelMeta[]>([]) // 所有模型
  const cache = markRaw<Map<string, ModelMeta>>(new Map()) // 检索缓存

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
  function findByProvider(name: ProviderName): ModelMeta[] {
    return models.filter(v => v.providerName === name)
  }

  // TODO: optimize
  function refresh(newModels: ModelMeta[]) {
    newModels.forEach(v => {
      const model = find(v.id)
      if (!model) {
        models.push(v)
      }
    })
  }

  const init = async () => {
    const data = await get<ModelMeta[]>(SAVE_KEY)
    if (data) {
      models.push(...data)
    } else {
      models.push(...modelsDefault())
    }
  }
  watch(models, () => {
    save<ModelMeta[]>(SAVE_KEY, toRaw(models))
  })
  init()
  return {
    models,
    setModel,
    find,
    findByProvider,
    refresh,
  }
})
