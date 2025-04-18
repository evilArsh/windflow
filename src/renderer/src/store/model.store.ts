import { ModelMeta, ProviderName } from "@renderer/types"
import { defineStore } from "pinia"
import { modelsDefault } from "./default/models.default"
import { db } from "@renderer/usable/useDatabase"
import { useThrottleFn } from "@vueuse/core"
import { Reactive } from "vue"
const useData = (models: Reactive<ModelMeta[]>) => {
  const update = useThrottleFn(async (data: ModelMeta) => await db.model.put(toRaw(data)), 300, true)
  async function refresh(newModels: ModelMeta[]) {
    await db.model.bulkPut(newModels)
    await fetch()
  }
  async function find(modelId?: string) {
    if (!modelId) return
    return db.model.get(modelId)
  }

  const fetch = async () => {
    try {
      models.length = 0
      const defaultData = modelsDefault()
      const data = await db.model.toArray()
      data.forEach(v => {
        models.push(v)
      })
      for (const v of defaultData) {
        if (!models.find(model => model.id === v.id)) {
          models.push(v)
          await db.model.add(v)
        }
      }
    } catch (error) {
      console.error(`[fetch models] ${(error as Error).message}`)
    }
  }
  return {
    fetch,
    update,
    find,
    refresh,
  }
}
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
  function findByProvider(name: ProviderName): ModelMeta[] {
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
