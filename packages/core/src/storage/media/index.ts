import { Media } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import { db } from "../index"

export async function add(data: Media) {
  return db.media.add(cloneDeep(data))
}
export async function get(mediaId: string) {
  return db.media.get(mediaId)
}

export async function remove(mediaId: string) {
  return db.media.delete(mediaId)
}
