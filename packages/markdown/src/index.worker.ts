import PQueue from "p-queue"
import { useParser } from "./parser"
import { MDWorkerMessage } from "./types"
import { uniqueId } from "@toolmain/shared"

function useTasker() {
  const context = new Map<string, { queue: PQueue; control: Record<string, AbortController> }>()
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
        control: {},
      }
      context.set(id, ctx)
    }
    const tId = uniqueId()
    const ctrl = new AbortController()
    ctx.control[tId] = ctrl
    ctx.queue.add(
      async ({ signal }) => {
        try {
          console.log(`[task start] id: ${id}, taskId: ${tId}`)
          await task(signal)
        } catch (error) {
          console.log(`[task failed] id: ${id}, taskId: ${tId}`, error)
        } finally {
          delete ctx.control[tId]
        }
      },
      { id: tId, signal: ctrl.signal }
    )
  }
  function remove(id: string) {
    const ctx = context.get(id)
    if (!ctx) return
    for (const [key, value] of Object.entries(ctx.control)) {
      console.log(`[task end] id: ${id} taskId: ${key}`)
      value.abort()
    }
    ctx.control = {}
    ctx.queue.clear()
    console.log(`[task remove] id: ${id}`)
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
