import { storage } from "@windai/core/storage"
import { Media } from "@windai/core/types"

export class MediaStorage {
  async add(data: Media) {
    return storage.media.add(data)
  }
  async remove(mediaId: string) {
    return storage.media.remove(mediaId)
  }
  async get(mediaId: string) {
    return storage.media.get(mediaId)
  }
}
