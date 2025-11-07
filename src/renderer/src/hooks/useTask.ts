import PQueue from "p-queue"
export function useTask(queue: PQueue) {
  const isPending = ref(false)

  const clear = () => {
    queue.pause()
    queue.clear()
  }

  queue.addListener("idle", () => (isPending.value = false))
  queue.addListener("add", () => (isPending.value = true))
  queue.addListener("active", () => (isPending.value = true))
  return {
    isPending: readonly(isPending),
    getQueue: () => queue,
    pending: () => isPending.value,
    clear,
  }
}
