import { ModelMeta, ProviderName } from "@renderer/types"
import { defineStore } from "pinia"
import { modelsDefault } from "./default/models.default"
import { db } from "@renderer/usable/useDatabase"
import { useThrottleFn } from "@vueuse/core"
import { Reactive } from "vue"
const useData = (models: Reactive<ModelMeta[]>) => {
  const update = useThrottleFn(async (data: ModelMeta) => await db.model.put(toRaw(data)), 300, true)
  async function refresh(newModels: ModelMeta[]) {
    for (const v of newModels) {
      const model = await db.model.get(v.id)
      if (!model) {
        models.push(v)
        await db.model.add(v)
      }
    }
  }

  const fetch = async () => {
    try {
      const data = await db.model.toArray()
      if (data.length > 0) {
        models.push(...data)
      } else {
        const data = modelsDefault()
        models.push(...data)
        await db.model.bulkAdd(data)
      }
    } catch (error) {
      console.error(`[fetch models] ${(error as Error).message}`)
    }
  }
  fetch()
  return {
    update,
    refresh,
  }
}
export default defineStore("model", () => {
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
  const { update, refresh } = useData(models)

  return {
    models,
    setModel,
    find,
    findByProvider,
    api: {
      update,
      refresh,
    },
  }
})
