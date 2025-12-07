import { uniqueId } from "@toolmain/shared"
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

  function clear() {
    queue.pause()
    queue.clear()
  }
  function add<TaskResultType>(function_: Task<TaskResultType>): TaskHandler<TaskResultType> {
    const id = uniqueId()
    const controller = new AbortController()
    const pending = queue.add(function_, {
      id,
      signal: controller.signal,
    })
    return {
      abort() {
        controller.abort("task aborted")
      },
      pending,
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
