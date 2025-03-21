import { ModelConfig, ProviderName } from "@renderer/types"
import { defineStore } from "pinia"
import { modelsDefault } from "./default/models.default"
import { merge } from "lodash-es"
import useDataStorage from "@renderer/usable/useDataStorage"

export default defineStore("model", () => {
  const SAVE_KEY = "models"
  const { save, get } = useDataStorage()
  const models = reactive<ModelConfig[]>([])

  function setModel(newModel: ModelConfig) {
    models.push(newModel)
  }
  function find(name: string) {
    return models.find(v => v.name === name)
  }
  function findByProvider(name: ProviderName): ModelConfig[] {
    return models.filter(v => v.providerName === name)
  }
  const init = async () => {
    const data = await get<ModelConfig[]>(SAVE_KEY)
    models.push(...merge(modelsDefault(), data))
  }
  watch(models, () => {
    save<ModelConfig[]>(SAVE_KEY, toRaw(models))
  })
  init()
  return { models, setModel, find, findByProvider }
})
