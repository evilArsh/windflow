import { QueryParams, SettingKeys, Settings, SettingsValue } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import { useDBQueue } from "@windflow/core/storage"

const queue = useDBQueue()
export async function get(id: SettingKeys, params?: QueryParams) {
  return queue.add(db => db.settings.get(id), params)
}
export async function add(data: Settings<SettingsValue>, params?: QueryParams) {
  return queue.add(db => db.settings.add(cloneDeep(data)), params)
}
export async function put(data: Settings<SettingsValue>, params?: QueryParams) {
  return queue.add(db => db.settings.put(cloneDeep(data)), params)
}
export async function fetch() {
  return queue.add(db => db.settings.toArray())
}
