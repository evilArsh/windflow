import { db } from "@renderer/db"
import { SettingKeys, Settings, SettingsValue } from "@renderer/types"
import { cloneDeep } from "@toolmain/shared"

export const useData = () => {
  const get = async (id: SettingKeys) => {
    return db.settings.get(id)
  }
  const add = async (data: Settings<SettingsValue>) => db.settings.add(cloneDeep(data))
  const update = async (data: Settings<SettingsValue>) => db.settings.put(cloneDeep(data))
  return {
    get,
    add,
    update,
  }
}
