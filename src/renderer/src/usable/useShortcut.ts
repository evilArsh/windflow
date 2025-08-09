/**
 * author: arshdebian@163.com
 */
import { WatchHandle } from "vue"
import hotkeys from "hotkeys-js"

export default () => {
  const handler: Array<{ key: string; handler: WatchHandle }> = []
  hotkeys.filter = () => {
    return true
  }
  function cleanAll() {
    handler.forEach(h => {
      hotkeys.unbind(h.key)
      h.handler.stop()
    })
  }
  function clean(key: string) {
    hotkeys.unbind(key)
    const index = handler.findIndex(h => h.key === key)
    if (index === -1) return
    handler[index].handler.stop()
    handler.splice(index, 1)
  }
  function listen(shortcut: string, callback: (active: boolean, ...args: unknown[]) => void) {
    const key = ref(shortcut)
    const watchHandler = watch(
      key,
      (val, old) => {
        if (old) clean(old)
        hotkeys(
          val,
          {
            keyup: true,
            capture: true,
            // single: true,
          },
          (event, _handler) => {
            callback(event.type === "keydown")
          }
        )
      },
      { immediate: true }
    )
    handler.push({
      key: key.value,
      handler: watchHandler,
    })
    function trigger(...args: unknown[]) {
      callback(true, ...args)
    }
    return {
      key,
      trigger,
    }
  }
  onBeforeUnmount(() => {
    cleanAll()
  })
  return {
    cleanAll,
    clean,
    listen,
  }
}
