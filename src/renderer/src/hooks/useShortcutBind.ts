import { ShortcutOptions, useShortcut } from "@toolmain/shared"
import useSettingsStore from "@renderer/store/settings"
import { SettingKeys } from "@windflow/core/types"

/**
 * simple wrapper of `useSettingsStore` and `useShortcut`
 */
export function useShortcutBind(
  bindKey: SettingKeys,
  callback: (active: boolean, key: string, ...args: unknown[]) => Promise<void> | void,
  config?: ShortcutOptions
) {
  const shortcut = useShortcut()
  const settingsStore = useSettingsStore()

  const { key, trigger, taskPending } = shortcut.listen("", callback, config)
  settingsStore.dataBind(bindKey, key)

  return {
    key,
    trigger,
    /**
     * Continuous triggering of shortcuts is a synchronous queue,
     * and this field indicates whether there are still tasks in the queue.
     */
    taskPending,
  }
}
