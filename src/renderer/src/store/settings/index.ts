import { defineStore } from "pinia"
import { Settings, SettingsValue } from "@renderer/types"
import { useData } from "./api"
import { Reactive } from "vue"
import { isFunction } from "@toolmain/shared"
import PQueue from "p-queue"

export default defineStore("settings", () => {
  const settings = reactive<Record<string, Settings<SettingsValue>>>({})
  const api = useData()
  const queue = markRaw(new PQueue({ concurrency: 1 }))

  /**
   * Get a setting value
   * @param id - The name of the setting
   * @param defaultValue - The default value of the setting
   * @returns The setting value
   */
  const get = async <T extends SettingsValue>(id: string, defaultValue: T): Promise<Settings<T>> => {
    return queue.add(
      async () => {
        if (settings[id]) {
          return settings[id] as Settings<T>
        } else {
          // 数据库查询
          const data = (await api.get(id)) as Settings<T> | undefined
          if (data) {
            settings[id] = data
            return data
          } else {
            const val: Settings<T> = { id, value: defaultValue }
            settings[id] = val
            await api.add(val)
            return settings[id] as Settings<T>
          }
        }
      },
      {
        timeout: 30000,
      }
    )
  }
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
    const watcher = watch(
      wrapData,
      async val => {
        if (configData.value) {
          configData.value.value = isRef(val) || isFunction(val) ? toValue(val) : (toRaw(val) as T)
          await api.update(configData.value)
          callBack?.(configData.value.value)
          updateValue(id, configData.value)
        }
      },
      { deep: true, immediate: true }
    )
    get(id, defaultValue).then(res => {
      configData.value = res
      if (isRef(wrapData)) {
        wrapData.value = configData.value.value
      } else if (isReactive(wrapData)) {
        Object.assign(wrapData, configData.value.value)
      }
    })
    onBeforeUnmount(() => {
      watcher.stop()
    })
  }
  return {
    dataWatcher,
    get,
    settings,
    api,
  }
})
