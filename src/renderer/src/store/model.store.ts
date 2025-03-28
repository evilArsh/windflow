import { ModelMeta, ProviderName } from "@renderer/types"
import { defineStore } from "pinia"
import { modelsDefault } from "./default/models.default"
import { storeKey, useDatabase } from "@renderer/usable/useDatabase"
import { useThrottleFn } from "@vueuse/core"

export default defineStore(storeKey.model, () => {
  const { getAll, add, get, put } = useDatabase()

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

  const dbUpdate = useThrottleFn(async (data: ModelMeta) => await put("model", data.id, toRaw(data)), 300, true)

  async function refresh(newModels: ModelMeta[]) {
    for (const v of newModels) {
      const model = await get("model", v.id)
      if (!model) {
        models.push(v)
        await add("model", v)
      }
    }
  }

  const fetch = async () => {
    try {
      const data = await getAll<ModelMeta>("model")
      if (data.length > 0) {
        models.push(...data)
      } else {
        const data = modelsDefault()
        models.push(...data)
        for (const item of data) {
          await add("model", item)
        }
      }
    } catch (error) {
      console.error(`[fetch models] ${(error as Error).message}`)
    }
  }

  fetch()
  return {
    models,
    dbUpdate,
    setModel,
    find,
    findByProvider,
    refresh,
  }
})
