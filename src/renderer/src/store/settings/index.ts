import { defineStore } from "pinia"
import { SettingKeys, Settings, SettingsValue } from "@windflow/core/types"
import { Reactive } from "vue"
import { isArray, isFunction, isNull, isObject, isString, isUndefined } from "@toolmain/shared"
import { storage } from "@windflow/core/storage"

export default defineStore("settings", () => {
  const settings = reactive<Record<string, Settings<SettingsValue>>>({})
  const updateValue = (id: string, val: Settings<SettingsValue>) => {
    const data = settings[id]
    if (data) {
      data.value = val.value
    } else {
      settings[id] = val
    }
  }
  /**
   * get a setting value
   * @param id - The name of the setting
   * @returns The setting value
   */
  async function get<T extends SettingsValue>(id: SettingKeys): Promise<Settings<T> | undefined> {
    if (settings[id]) {
      return settings[id] as Settings<T>
    } else {
      const data = (await storage.settings.get(id)) as Settings<T> | undefined
      if (data) {
        settings[id] = data
        return settings[id] as Settings<T>
      }
    }
    return
  }
  async function update(data: Settings<SettingsValue>) {
    await storage.settings.put(data)
    updateValue(data.id, data)
  }
  async function add(data: Settings<SettingsValue>) {
    await storage.settings.add(data)
    updateValue(data.id, data)
  }
  /**
   * monitoring `wrapData` value, and sync new value to database which is related to `id`
   */
  function dataWatcher<T extends SettingsValue>(
    id: SettingKeys,
    wrapData: Ref<T> | Reactive<T> | (() => T),
    defaultValue: T,
    callBack?: (data: T, old?: T) => void
  ) {
    const unwrap = (data: Ref<T> | Reactive<T> | (() => T)): T => {
      return isRef(data) || isFunction(data) ? toValue(data) : (toRaw(data) as T)
    }
    const isFalsy = (cacheValue: T) => {
      if (isArray(cacheValue)) return cacheValue.length === 0
      if (isNull(cacheValue) || isUndefined(cacheValue)) return true
      if (isString(cacheValue)) return cacheValue.length == 0
      if (isObject(cacheValue)) return Object.keys(cacheValue).length === 0
      return false
    }
    const updateWrapData = (val: T) => {
      if (isRef(wrapData)) {
        wrapData.value = val
      } else if (isReactive(wrapData)) {
        Object.assign(wrapData, val)
      } else {
        /**
         * cannot set `wrapData`, because it is a function, just callback
         */
        callBack?.(val)
      }
    }
    if (!settings[id]) {
      settings[id] = { id, value: defaultValue } as Settings<T>
      update(settings[id])
      updateWrapData(defaultValue)
    } else {
      const cacheValue = settings[id] as Settings<T>
      // if cached value was not set, use the default value and update cache
      const f = isFalsy(cacheValue.value)
      const df = isFalsy(defaultValue)
      const val = f && !df ? defaultValue : cacheValue.value
      updateWrapData(val)
      if (f && !df) {
        settings[id].value = val
        update(settings[id])
      }
    }
    const watcher = watch(
      wrapData,
      (val, old) => {
        settings[id].value = unwrap(val)
        update(settings[id])
        callBack?.((settings[id] as Settings<T>).value, isUndefined(old) ? undefined : unwrap(old))
      },
      { deep: true, immediate: true }
    )
    onBeforeUnmount(watcher.stop)
  }

  /**
   * sync settings data to `target`
   */
  function dataBind<T extends SettingsValue>(id: SettingKeys, target: Ref<T> | Reactive<T>) {
    const watcher = watch(
      () => settings[id],
      val => {
        if (!val) return
        if (isRef(target)) {
          target.value = val.value as T
        } else {
          Object.assign(target, val.value)
        }
      },
      { deep: true, immediate: true }
    )
    onBeforeUnmount(watcher.stop)
  }
  async function init() {
    // need pre-load data rather than loading when using, because of possibly UI rendering lag
    const data = await storage.settings.fetch()
    data.forEach(item => {
      settings[item.id] = item
    })
  }

  return {
    init,
    dataWatcher,
    dataBind,
    get,
    settings,
    update,
    add,
  }
})
