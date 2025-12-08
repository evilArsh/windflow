import { QueryParams, SettingKeys, Settings, SettingsValue } from "@windflow/core/types"
import { cloneDeep } from "@toolmain/shared"
import PQueue from "p-queue"
import { resolveDb } from "../utils"

const queue = new PQueue({ concurrency: 1 })
export async function get(id: SettingKeys, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).settings.get(id))
}
export async function add(data: Settings<SettingsValue>, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).settings.add(cloneDeep(data)))
}
export async function put(data: Settings<SettingsValue>, params?: QueryParams) {
  return queue.add(async () => resolveDb(params).settings.put(cloneDeep(data)))
}
