import { SettingsStorage } from "./storage"

export class SettingsManager {
  readonly #storage: SettingsStorage
  constructor() {
    this.#storage = new SettingsStorage()
  }
  getStorage() {
    return this.#storage
  }
}
