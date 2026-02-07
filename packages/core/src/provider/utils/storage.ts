import { storage } from "@windflow/core/storage"
import { ProviderMeta } from "@windflow/core/types"

export class ProviderStorage {
  async put(meta: ProviderMeta) {
    return storage.provider.put(meta)
  }
  async add(meta: ProviderMeta) {
    return storage.provider.add(meta)
  }
  async clear() {
    return storage.provider.clear()
  }
  async fetch() {
    return storage.provider.fetch()
  }
}
