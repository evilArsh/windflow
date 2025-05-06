import useHotKey from "@renderer/usable/useHotKey"
import { WatchHandle } from "vue"
export default () => {
  const { on, cleanAll, clean: cleanKey } = useHotKey()
  const handler = shallowRef<WatchHandle[]>([])
  function listen(shortcut: string, callback: (status: { active: boolean }, ...args: unknown[]) => void) {
    const key = ref(shortcut)
    const watchHandler = watch(
      key,
      (val, old) => {
        if (old) cleanKey(old)
        on(val, res => callback(res))
      },
      { immediate: true }
    )
    handler.value.push(watchHandler)
    function clean() {
      key.value && cleanKey(key.value)
    }
    function trigger(...args: unknown[]) {
      callback({ active: true }, ...args)
    }
    return { key, clean, trigger }
  }
  onBeforeUnmount(() => {
    handler.value.forEach(watcher => {
      watcher.stop()
    })
    cleanAll()
  })
  return {
    listen,
  }
}
