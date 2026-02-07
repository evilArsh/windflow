import { storage } from "@windflow/core/storage"
import { ModelMeta } from "@windflow/core/types"

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
  async fetch() {
    return storage.model.fetch()
  }
}
