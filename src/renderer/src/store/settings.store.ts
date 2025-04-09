import { defineStore } from "pinia"
import { db } from "@renderer/usable/useDatabase"
import { useThrottleFn } from "@vueuse/core"
import { Settings, SettingsValue } from "@renderer/types"
import { Reactive } from "vue"

export default defineStore("settings", () => {
  const settings = reactive<Record<string, Settings<SettingsValue>>>({})

  /**
   * Get a setting value
   * @param id - The name of the setting
   * @param defaultValue - The default value of the setting
   * @returns The setting value
   */
  async function get<T extends SettingsValue>(id: string, defaultValue: T): Promise<Settings<T>> {
    if (settings[id]) {
      return settings[id] as Settings<T>
    } else {
      // 数据库查询
      const data = (await db.settings.get(id)) as Settings<T> | undefined
      if (data) {
        settings[id] = data
        return data
      } else {
        const val: Settings<T> = { id, value: defaultValue }
        settings[id] = val
        await db.settings.add(val)
        return settings[id] as Settings<T>
      }
    }
  }

  const dbUpdate = useThrottleFn(async (data: Settings<SettingsValue>) => await db.settings.put(toRaw(data)), 300, true)
  /**
   * 配置数据监听，实时更新到数据库
   */
  function dataWatcher<T extends SettingsValue>(id: string, wrapData: Ref<T> | Reactive<T>, defaultValue: T) {
    const configData = ref<Settings<T>>()
    get(id, defaultValue).then(res => {
      configData.value = res
      if (isRef(wrapData)) {
        wrapData.value = configData.value.value
      } else {
        Object.assign(wrapData, configData.value.value)
      }
    })
    return watch(
      wrapData,
      async val => {
        if (configData.value) {
          configData.value.value = isRef(val) ? toValue(val) : (toRaw(val) as T)
          await dbUpdate(configData.value)
        }
      },
      { deep: true }
    )
  }

  return {
    get,
    dbUpdate,
    dataWatcher,
  }
})
