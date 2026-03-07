import PQueue from "p-queue"
import { useParser } from "./parser"
import type { MDWorkerMessage } from "./types"

function useTasker() {
  const context = new Map<string, { queue: PQueue; control: AbortController }>()
  function has(id: string) {
    return context.has(id)
  }
  function get(id: string) {
    return context.get(id)
  }
  function add(id: string, task: (signal?: AbortSignal) => Promise<void>) {
    let ctx = context.get(id)
    if (!ctx) {
      ctx = {
        queue: new PQueue({ concurrency: 1 }),
        control: new AbortController(),
      }
      context.set(id, ctx)
    }
    if (ctx.control.signal.aborted) {
      return
    }
    // console.log(`[task start] id: ${id}`)
    ctx.queue.add(
      async ({ signal }) => {
        try {
          await task(signal)
        } catch (error) {
          console.log(`[task failed] id: ${id}`, error)
        }
      },
      { signal: ctx.control.signal }
    )
  }
  function remove(id: string) {
    const ctx = context.get(id)
    if (!ctx) return
    ctx.control.abort()
    ctx.queue.clear()
    context.delete(id)
  }
  function getContext() {
    return context
  }

  return { has, get, add, remove, getContext }
}
const parser = useParser()
const task = useTasker()
function postMessage(message: MDWorkerMessage) {
  self.postMessage(message)
}
function addTask(id: string, markdown: string) {
  task.add(id, async signal => {
    const res = await parser.parse(markdown)
    if (signal?.aborted) return
    if (!res) return
    postMessage({
      id,
      type: "ParseResponse",
      node: res,
    })
  })
}

self.addEventListener("message", (ev: MessageEvent<MDWorkerMessage>) => {
  const { data } = ev
  if (data.type === "Parse") {
    addTask(data.id, data.markdown)
  } else if (data.type === "Dispose") {
    task.remove(data.id)
  }
})
