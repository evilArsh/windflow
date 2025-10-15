import { db } from "@renderer/db"
import { Settings, SettingsValue } from "@renderer/types"
import PQueue from "p-queue"
import { cloneDeep } from "@toolmain/shared"

export const useData = () => {
  const queue = markRaw(new PQueue({ concurrency: 1 }))
  const get = async (id: string) => {
    return db.settings.get(id)
  }
  const add = async (data: Settings<SettingsValue>) => queue.add(async () => db.settings.add(cloneDeep(data)))
  const update = async (data: Settings<SettingsValue>) => queue.add(async () => db.settings.put(cloneDeep(data)))

  return {
    get,
    add,
    update,
  }
}
