import { ModelMeta } from "@renderer/types"
import { defineStore } from "pinia"
import { useData } from "./data"
export default defineStore("model", () => {
  const models = reactive<ModelMeta[]>([]) // 所有模型
  const cache = markRaw<Map<string, ModelMeta>>(new Map()) // 检索缓存
  const api = useData(models)

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

  return {
    models,
    setModel,
    find,
    findByProvider,
    api,
  }
})
