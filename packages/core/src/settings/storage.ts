import { storage } from "@windflow/core/storage"
import { SettingKeys, Settings, SettingsValue } from "@windflow/core/types"

export class SettingsStorage {
  async get(settingsId: SettingKeys) {
    return storage.settings.get(settingsId)
  }
  async put(data: Settings<SettingsValue>) {
    return storage.settings.put(data)
  }
  async add(data: Settings<SettingsValue>) {
    return storage.settings.add(data)
  }
  async fetch() {
    return storage.settings.fetch()
  }
}
