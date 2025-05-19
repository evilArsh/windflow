import { defineStore } from "pinia"
import { db } from "@renderer/usable/useDatabase"
import { useThrottleFn } from "@vueuse/core"
import { Settings, SettingsValue } from "@renderer/types"
import { Reactive } from "vue"

const useData = (settings: Reactive<Record<string, Settings<SettingsValue>>>) => {
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

  const update = useThrottleFn(async (data: Settings<SettingsValue>) => await db.settings.put(toRaw(data)), 300, true)
  const updateValue = (id: string, val: Settings<SettingsValue>) => {
    const data = settings[id]
    if (data) {
      data.value = val.value
    } else {
      settings[id] = val
    }
  }
  /**
   * 配置数据监听，实时更新到数据库
   */
  function dataWatcher<T extends SettingsValue>(
    id: string,
    wrapData: Ref<T> | Reactive<T> | (() => T),
    defaultValue: T,
    callBack?: (data: T) => void
  ) {
    const configData = ref<Settings<T>>()
    get(id, defaultValue).then(res => {
      configData.value = res
      if (isRef(wrapData)) {
        wrapData.value = configData.value.value
      } else if (isReactive(wrapData)) {
        Object.assign(wrapData, configData.value.value)
      } else {
        // TODO
      }
      callBack?.(configData.value.value)
      updateValue(id, configData.value)
    })
    return watch(
      wrapData,
      async val => {
        if (configData.value) {
          configData.value.value = isRef(val) || isFunction(val) ? toValue(val) : (toRaw(val) as T)
          await update(configData.value)
          callBack?.(configData.value.value)
          updateValue(id, configData.value)
        }
      },
      { deep: true }
    )
  }
  return {
    get,
    update,
    dataWatcher,
  }
}

export default defineStore("settings", () => {
  const settings = reactive<Record<string, Settings<SettingsValue>>>({})
  const api = useData(settings)
  return {
    api,
    settings,
  }
})
