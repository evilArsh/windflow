import { Media, QueryParams } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import { useDBQueue } from "@windflow/core/storage"

const queue = useDBQueue()
export async function add(data: Media, params?: QueryParams) {
  return queue.add(db => db.media.add({ ...cloneDeep(data), data: data.data }), { ...params, disableQueue: true })
}
export async function bulkAdd(datas: Media[], params?: QueryParams) {
  return queue.add(db => db.media.bulkAdd(datas.map(item => ({ ...cloneDeep(item), data: item.data }))), {
    ...params,
    disableQueue: true,
  })
}
export async function get(mediaId: string, params?: QueryParams) {
  return queue.add(db => db.media.get(mediaId), { ...params, disableQueue: true })
}
export async function remove(mediaId: string, params?: QueryParams) {
  return queue.add(db => db.media.delete(mediaId), { ...params, disableQueue: true })
}
export async function bulkRemove(mediaIds: string[], params?: QueryParams) {
  return queue.add(db => db.media.bulkDelete(mediaIds), { ...params, disableQueue: true })
}
