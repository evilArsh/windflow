import { defineStore } from "pinia"
import { SettingKeys, Settings, SettingsValue } from "@renderer/types"
import { useData } from "./api"
import { Reactive } from "vue"
import { isFunction, isUndefined } from "@toolmain/shared"

import { db } from "@renderer/db"

export default defineStore("settings", () => {
  const settings = reactive<Record<string, Settings<SettingsValue>>>({})
  const api = useData()

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
      const data = (await api.get(id)) as Settings<T> | undefined
      if (data) {
        settings[id] = data
        return settings[id] as Settings<T>
      }
    }
    return
  }
  async function update(data: Settings<SettingsValue>) {
    await api.update(data)
    updateValue(data.id, data)
  }
  async function add(data: Settings<SettingsValue>) {
    await api.add(data)
    updateValue(data.id, data)
  }
  /**
   * monitoring `wrapData` value, and update new value database which is related to `id`
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
    if (!settings[id]) {
      settings[id] = { id, value: defaultValue } as Settings<T>
    } else {
      const cacheValue = settings[id] as Settings<T>
      if (isRef(wrapData)) {
        wrapData.value = cacheValue.value
      } else if (isReactive(wrapData)) {
        Object.assign(wrapData, cacheValue.value)
      } else {
        /**
         * cannot set `wrapData`, because it is a function, just callback
         */
        callBack?.(cacheValue.value)
      }
    }
    const watcher = watch(
      wrapData,
      (val, old) => {
        settings[id].value = unwrap(val)
        update(settings[id])
        updateValue(id, settings[id])
        callBack?.((settings[id] as Settings<T>).value, isUndefined(old) ? undefined : unwrap(old))
      },
      { deep: true, immediate: true }
    )
    onBeforeUnmount(() => {
      watcher.stop()
    })
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
    onBeforeUnmount(() => {
      watcher.stop()
    })
  }
  async function init() {
    // need pre-load data rather than loading when using, because of possibly UI rendering lag
    const data = await db.settings.toCollection().toArray()
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
