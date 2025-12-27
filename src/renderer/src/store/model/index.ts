import { ModelMeta } from "@windflow/core/types"
import { defineStore } from "pinia"
import { getIconHTML } from "@renderer/components/SvgPicker"
import { modelsDefault, storage } from "@windflow/core/storage"
import { useSvgIcon } from "@renderer/hooks/useSvgIcon"
export default defineStore("model", () => {
  const { providerSvgIcon } = useSvgIcon()
  const models = reactive<ModelMeta[]>([]) // 所有模型
  const cache: Map<string, ModelMeta> = new Map() // 检索缓存
  const defaultLogo = getIconHTML(providerSvgIcon, "user")

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
  function findByProvider(providerName: string): ModelMeta[] {
    return models.filter(v => v.providerName === providerName)
  }
  function getModelLogo(meta?: ModelMeta) {
    return meta
      ? meta.icon ||
          getIconHTML(providerSvgIcon, meta.subProviderName.toLowerCase()) ||
          getIconHTML(providerSvgIcon, meta.providerName.toLowerCase()) ||
          defaultLogo
      : defaultLogo
  }
  async function refresh(metas: ModelMeta[]) {
    const ids = metas.map(item => item.id)
    const existingRecords = await storage.model.anyOf(ids)
    const existingMap = new Map(existingRecords.map(record => [record.id, record]))
    const recordsToWrite = metas.map(newItem => {
      const existing = existingMap.get(newItem.id)
      if (existing) {
        return {
          ...newItem,
          type: existing.type,
          active: existing.active,
          icon: existing.icon ?? getModelLogo(newItem),
        }
      }
      return newItem
    })
    await storage.model.bulkPut(recordsToWrite)
  }
  async function put(data: ModelMeta) {
    await storage.model.put(data)
    const current = find(data.id)
    current && Object.assign(current, data)
  }
  async function init() {
    models.length = 0
    cache.clear()
    const data = await storage.model.fetch()
    const defaultData = modelsDefault(providerSvgIcon)
    data.forEach(v => {
      if (!v.icon) {
        v.icon = getModelLogo(v)
      }
      models.push(v)
    })
    for (const v of defaultData) {
      if (!models.find(model => model.id === v.id)) {
        models.push(v)
        await storage.model.add(v)
      }
    }
  }

  return {
    models,
    init,
    setModel,
    find,
    findByProvider,
    refresh,
    put,
    getModelLogo,
  }
})
