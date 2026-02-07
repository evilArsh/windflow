import { defineStore } from "pinia"
import { SettingKeys, Settings, SettingsValue } from "@windflow/core/types"
import { Reactive } from "vue"
import { cloneDeep, isArray, isFunction, isNull, isObject, isString, isUndefined } from "@toolmain/shared"
import { useSettings } from "@renderer/hooks/useCore"

export default defineStore("settings", () => {
  const settings = reactive<Record<string, Settings<SettingsValue>>>({})
  const stMgr = useSettings()
  const storage = stMgr.getStorage()
  const updateValue = (id: string, val: Settings<SettingsValue>) => {
    const data = settings[id]
    if (!isUndefined(data)) {
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
      const data = (await storage.get(id)) as Settings<T> | undefined
      if (data) {
        settings[id] = data
        return settings[id] as Settings<T>
      }
    }
    return
  }
  async function update(data: Settings<SettingsValue>) {
    await storage.put(data)
    updateValue(data.id, data)
  }
  async function add(data: Settings<SettingsValue>) {
    await storage.add(data)
    updateValue(data.id, data)
  }
  /**
   * monitoring `wrapData` value, and sync new value to database which is related to `id`,
   *
   * if `wrapData` was null, only monitor the return value
   */
  function dataWatcher<T extends SettingsValue>(
    id: SettingKeys,
    wrapData: Ref<T> | Reactive<T> | (() => T) | null,
    defaultValue: T,
    callBack?: (data: T, old?: T) => void
  ): { data: Ref<T> } {
    const innerDefault = cloneDeep(defaultValue)
    const bindValue = ref(innerDefault) as Ref<T>
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
      bindValue.value = val
      if (isNull(wrapData)) {
        callBack?.(val)
        return
      }
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
    const syncData = (newVal: Ref<T> | Reactive<T> | (() => T), oldVal?: Ref<T> | Reactive<T> | (() => T)) => {
      settings[id].value = unwrap(newVal)
      update(settings[id])
      callBack?.((settings[id] as Settings<T>).value, isUndefined(oldVal) ? undefined : unwrap(oldVal))
    }
    if (!settings[id]) {
      settings[id] = { id, value: innerDefault } as Settings<T>
      update(settings[id])
      updateWrapData(innerDefault)
    } else {
      const cacheValue = settings[id] as Settings<T>
      // if cached value was not set, use the default value and update cache
      const f = isFalsy(cacheValue.value)
      const df = isFalsy(innerDefault)
      const val = f && !df ? innerDefault : cacheValue.value
      updateWrapData(val)
      if (f && !df) {
        settings[id].value = val
        update(settings[id])
      }
    }
    if (!isNull(wrapData)) {
      // sync wrapData
      const watcher = watch(wrapData, syncData, { deep: true, immediate: true })
      onBeforeUnmount(watcher.stop)
    }
    const watcherBind = watch(bindValue, syncData, { deep: true })
    onBeforeUnmount(watcherBind.stop)
    return {
      data: bindValue,
    }
  }

  /**
   * sync settings data to `target`
   */
  function dataBind<T extends SettingsValue>(
    id: SettingKeys,
    target?: Ref<T> | Reactive<T>
  ): { data: Ref<T | undefined> } {
    const bindValue = ref()
    const syncData = (val?: Settings<SettingsValue>) => {
      bindValue.value = val?.value
      if (isUndefined(val) || !target) return
      if (isRef(target)) {
        target.value = val.value as T
      } else {
        Object.assign(target, val.value)
      }
    }
    const watcher = watch(() => settings[id], syncData, { deep: true, immediate: true })
    onBeforeUnmount(watcher.stop)
    return {
      data: bindValue,
    }
  }
  /**
   * listen settings data change
   */
  function dataListen<T extends SettingsValue>(id: SettingKeys, callBack: (data?: T, old?: T) => void) {
    const watcher = watch(
      () => settings[id],
      (val, old) => {
        callBack(val?.value as T, old?.value as T)
      },
      { deep: true, immediate: true }
    )
    onBeforeUnmount(watcher.stop)
  }
  async function init() {
    // need pre-load data rather than loading when using, because of possibly UI rendering lag
    const data = await storage.fetch()
    data.forEach(item => {
      settings[item.id] = item
    })
  }

  return {
    init,
    dataWatcher,
    dataBind,
    dataListen,
    get,
    settings,
    update,
    add,
  }
})
