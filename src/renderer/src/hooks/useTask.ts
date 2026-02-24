import PQueue from "p-queue"

// -- export from p-queue as it didn't export it
export type TaskOptions = {
  readonly signal?: AbortSignal
}
type Task<TaskResultType> =
  | ((options: TaskOptions) => PromiseLike<TaskResultType>)
  | ((options: TaskOptions) => TaskResultType)

export type TaskConfigs = {
  /**
   * clear all pending/waiting tasks when one active executing task fail
   */
  clearWhenError?: boolean
}
export interface TaskHandler<TaskResultType> {
  abort(): void
  pending: Promise<TaskResultType>
}
export function useTask(queue: PQueue) {
  const isPending = ref(false)
  let ctrl: AbortController[] = []

  function clear() {
    ctrl.forEach(c => c.abort())
    ctrl = []
    queue.clear()
  }
  function add<TaskResultType>(taskFn: Task<TaskResultType>): TaskHandler<TaskResultType> {
    const controller = new AbortController()
    const pending = queue.add(taskFn, {
      signal: controller.signal,
    })
    const onAbort = () => {
      removeCtrl()
    }
    const removeCtrl = () => {
      controller.signal.removeEventListener("abort", onAbort)
      const index = ctrl.indexOf(controller)
      if (index > -1) {
        ctrl.splice(index, 1)
      }
    }
    ctrl.push(controller)
    controller.signal.addEventListener("abort", onAbort)
    const wrappedPending = pending
      .then(result => {
        removeCtrl()
        return result
      })
      .catch(error => {
        removeCtrl()
        throw error
      })
    return {
      abort() {
        controller.abort("task aborted")
      },
      pending: wrappedPending,
    }
  }
  queue.addListener("idle", () => (isPending.value = false))
  queue.addListener("add", () => (isPending.value = true))
  queue.addListener("active", () => (isPending.value = true))
  return {
    isPending: readonly(isPending),
    pending: () => isPending.value,
    getQueue: () => queue,
    clear,
    add,
  }
}
