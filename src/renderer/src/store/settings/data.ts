import { db } from "@renderer/usable/useDatabase"
import { useThrottleFn } from "@vueuse/core"
import { Settings, SettingsValue } from "@renderer/types"
import { Reactive } from "vue"
import PQueue from "p-queue"
import { cloneDeep } from "lodash-es"

export const useData = (settings: Reactive<Record<string, Settings<SettingsValue>>>) => {
  const queue = markRaw(new PQueue({ concurrency: 1 }))
  const updateValue = (id: string, val: Settings<SettingsValue>) => {
    const data = settings[id]
    if (data) {
      data.value = val.value
    } else {
      settings[id] = val
    }
  }

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
  const update = useThrottleFn(async (data: Settings<SettingsValue>) =>
    queue.add(async () => db.settings.update(data.id, cloneDeep(data)))
  )
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
          await update(configData.value)
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
    get,
    update,
    dataWatcher,
  }
}
