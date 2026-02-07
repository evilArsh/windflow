import { ModelStorage } from "./storage"

export * from "./utils"
export class ModelManager {
  readonly #storage: ModelStorage
  constructor() {
    this.#storage = new ModelStorage()
  }
  getStorage() {
    return this.#storage
  }
}
