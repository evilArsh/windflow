import { MCPStorage } from "./storage"

export class MCPManager {
  readonly #storage: MCPStorage
  constructor() {
    this.#storage = new MCPStorage()
  }
  getStorage() {
    return this.#storage
  }
}
