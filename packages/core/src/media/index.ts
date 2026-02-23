import { MediaStorage } from "./storage"

export class MediaManager {
  #storage: MediaStorage
  constructor() {
    this.#storage = new MediaStorage()
  }
  getStorage() {
    return this.#storage
  }
  async retrive() {}
}
