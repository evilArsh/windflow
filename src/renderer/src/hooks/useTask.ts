import PQueue from "p-queue"

export function useTask(concurrency?: number) {
  const queue = new PQueue({
    concurrency,
    autoStart: false,
  })
  const isPending = ref(false)

  const add = queue.add
  const clear = () => {
    queue.pause()
    queue.clear()
  }
  const removeAllListeners = queue.removeAllListeners
  const onEmpty = queue.onEmpty
  const onIdle = queue.onIdle

  queue.addListener("idle", () => (isPending.value = false))
  queue.addListener("add", () => (isPending.value = true))
  queue.addListener("active", () => (isPending.value = true))
  return {
    isPending: readonly(isPending),
    pending: () => isPending.value,
    add,
    clear,
    removeAllListeners,
    onEmpty,
    onIdle,
  }
}
