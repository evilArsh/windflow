import { ModelMeta } from "@renderer/types"
import { providerSvgIconKey } from "@renderer/app/hooks/useSvgIcon"
import { defineStore } from "pinia"
import { useData } from "./api"
import { useUtils } from "./utils"
import { IconifyJSON } from "@iconify/types"
import { modelsDefault } from "./default"
import { db } from "@renderer/db"
import { getIconHTML } from "@renderer/components/SvgPicker"
export default defineStore("model", () => {
  const providerSvgIcon = inject(providerSvgIconKey)
  const models = reactive<ModelMeta[]>([]) // 所有模型
  const cache: Map<string, ModelMeta> = new Map() // 检索缓存
  const api = useData()
  const utils = useUtils()
  const defaultLogo = getIconHTML(providerSvgIcon as IconifyJSON, "user")

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
          getIconHTML(providerSvgIcon as IconifyJSON, meta.subProviderName.toLowerCase()) ||
          getIconHTML(providerSvgIcon as IconifyJSON, meta.providerName.toLowerCase()) ||
          defaultLogo
      : defaultLogo
  }
  async function refresh(metas: ModelMeta[]) {
    const ids = metas.map(item => item.id)
    const existingRecords = await db.model.where("id").anyOf(ids).toArray()
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
    await db.model.bulkPut(recordsToWrite)
  }
  async function put(data: ModelMeta) {
    await api.put(data)
    const current = find(data.id)
    current && Object.assign(current, data)
  }
  async function init() {
    models.length = 0
    cache.clear()
    const data = await api.fetch()
    const defaultData = modelsDefault(providerSvgIcon as IconifyJSON)
    data.forEach(v => {
      if (!v.icon) {
        v.icon = getModelLogo(v)
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
    models,
    utils,
    init,
    setModel,
    find,
    findByProvider,
    refresh,
    put,
    getModelLogo,
  }
})
