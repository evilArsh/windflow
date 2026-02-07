import { KnowledgeStorage, EmbeddingStorage, RagFileStorage } from "./storage"
export class KnowledgeManager {
  readonly #kbStorage: KnowledgeStorage
  readonly #emStorage: EmbeddingStorage
  readonly #ragStorage: RagFileStorage
  constructor() {
    this.#kbStorage = new KnowledgeStorage()
    this.#emStorage = new EmbeddingStorage()
    this.#ragStorage = new RagFileStorage()
  }
  getEmbeddingStorage() {
    return this.#emStorage
  }
  getRagFileStorage() {
    return this.#ragStorage
  }
  getKnowledgeStorage() {
    return this.#kbStorage
  }
}

export { KnowledgeStorage, EmbeddingStorage, RagFileStorage }
