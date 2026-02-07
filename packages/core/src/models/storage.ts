import { storage } from "@windflow/core/storage"
import { ModelMeta, ModelType } from "@windflow/core/types"

export class ModelStorage {
  async anyOf(modelIds: string[]) {
    return storage.model.anyOf(modelIds)
  }
  async bulkPut(newModels: ModelMeta[]) {
    return storage.model.bulkPut(newModels)
  }
  async put(model: ModelMeta) {
    return storage.model.put(model)
  }
  async add(model: ModelMeta) {
    return storage.model.add(model)
  }
  /**
   * retrive the top N most frequently used models
   */
  async getMostFrequentModels(top: number, type?: ModelType) {
    return (await storage.model.getMostFrequentTops(top)).filter(meta => {
      return type ? meta.type.includes(type) : true
    })
  }
  async fetch() {
    return storage.model.fetch()
  }
}
