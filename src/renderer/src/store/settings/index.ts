import { defineStore } from "pinia"
import { Settings, SettingsValue } from "@renderer/types"
import { useData } from "./api"
import { Reactive } from "vue"
import { cloneDeep, isFunction, isUndefined } from "@toolmain/shared"
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
    callBack?: (data: T, old?: T) => void
  ) {
    const queue = markRaw(new PQueue({ concurrency: 1 }))
    const configData = ref<Settings<T>>()
    const execCallback = async (value: Settings<T>, old?: T) => {
      await api.update(value)
      callBack?.(value.value, old)
      updateValue(id, value)
    }
    const watcher = watch(
      wrapData,
      (val, old) => {
        queue.add(async () => {
          if (configData.value) {
            configData.value.value = isRef(val) || isFunction(val) ? toValue(val) : (toRaw(val) as T)
            await execCallback(
              configData.value,
              isUndefined(old) ? undefined : isRef(old) || isFunction(old) ? toValue(old) : (toRaw(old) as T)
            )
          }
        })
      },
      { deep: true, immediate: true }
    )
    get(id, defaultValue).then(res => {
      if (isRef(wrapData)) {
        configData.value = res
        wrapData.value = configData.value.value
      } else if (isReactive(wrapData)) {
        configData.value = res
        Object.assign(wrapData, configData.value.value)
      } else {
        const old = cloneDeep(configData.value?.value)
        configData.value = res
        /**
         * cannot set `wrapData`, because it is a function, `watcher` cannot be triggered, just callback
         */
        execCallback(configData.value, old)
      }
    })
    onBeforeUnmount(() => {
      watcher.stop()
    })
  }
  async function update(data: Settings<SettingsValue>) {
    return api.update(data)
  }
  return {
    dataWatcher,
    get,
    settings,
    update,
    api,
  }
})
