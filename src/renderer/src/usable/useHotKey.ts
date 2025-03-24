/**
 * author: arshdebian@163.com
 */
import { useMagicKeys } from "@vueuse/core"
import { WatchHandle } from "vue"
export interface HotKey {
  /**
   * 热键名字
   */
  name: string
  /**
   * 热键是否被按下
   */
  active: boolean
}
export default () => {
  const keys = useMagicKeys()
  const watchers = new Map<string, WatchHandle>()
  /**
   * 监听设置的热键 down up 状态
   * @param callback - 回调函数
   */
  function on(hotkey: string | string[], callback: (res: HotKey) => void) {
    ;(typeof hotkey === "string" ? [hotkey] : hotkey).forEach(key => {
      if (watchers.has(key)) {
        watchers.get(key)?.stop()
        watchers.delete(key)
      }
      const watcher = watch(keys[key], val => {
        callback({
          name: key,
          active: val,
        })
      })
      watchers.set(key, watcher)
    })
  }
  function cleanAll() {
    watchers.forEach((watcher, key) => {
      watcher.stop()
      watchers.delete(key)
    })
  }
  function clean(key: string) {
    const watcher = watchers.get(key)
    if (watcher) {
      watcher.stop()
      watchers.delete(key)
    }
  }
  return {
    on,
    cleanAll,
    clean,
  }
}
