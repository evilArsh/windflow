import { Media, QueryParams } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import { db } from "../index"
import { resolveDb } from "../utils"

export async function add(data: Media, params?: QueryParams) {
  return resolveDb(params).media.add(cloneDeep(data))
}
export async function bulkAdd(datas: Media[], params?: QueryParams) {
  return resolveDb(params).media.bulkAdd(datas)
}
export async function get(mediaId: string) {
  return db.media.get(mediaId)
}
export async function remove(mediaId: string, params?: QueryParams) {
  return resolveDb(params).media.delete(mediaId)
}
export async function bulkRemove(mediaIds: string[], params?: QueryParams) {
  return resolveDb(params).media.bulkDelete(mediaIds)
}
