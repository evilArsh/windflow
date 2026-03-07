import { App, InjectionKey, inject } from "vue"
import { EventEmitter } from "events"
import { MDWorkerExpose, MDWorkerMessage, MDWorkerMessageCore } from "./types"

export * from "./parser"
export * from "./types"
export * from "./utils"
export * from "./vue/types"
export * from "./vue/index"
export const MarkdownWorkerKey: InjectionKey<MDWorkerExpose> = Symbol("MarkdownWorker")

class MDWorkerExposeImpl implements MDWorkerExpose {
  #worker: Worker
  #event: EventEmitter
  #pendingMessages: MDWorkerMessage[]
  #animationFrameId: number | null = null

  constructor(worker: Worker) {
    this.#worker = worker
    this.#event = new EventEmitter()
    this.#pendingMessages = []
    this.#worker.addEventListener("message", (e: MessageEvent<MDWorkerMessage>) => {
      this.#pendingMessages.push(e.data)
      if (this.#animationFrameId === null) {
        this.#animationFrameId = requestAnimationFrame(this.#processPendingMessages.bind(this))
      }
    })
  }

  #processPendingMessages() {
    for (let i = 0; i < this.#pendingMessages.length; i++) {
      const message = this.#pendingMessages[i]
      this.#event.emit(message.id, message)
    }
    this.#animationFrameId = null
  }

  emit(id: string, event: MDWorkerMessageCore) {
    this.#worker.postMessage({ id, ...event })
    if (event.type === "Dispose") {
      this.#event.removeAllListeners(id)
    }
  }
  on(id: string, callback: (event: MDWorkerMessageCore) => void) {
    this.#event.on(id, callback)
  }
  terminate() {
    this.#animationFrameId && cancelAnimationFrame(this.#animationFrameId)
    this.#event.removeAllListeners()
    this.#worker.terminate()
  }
}
export function createMarkdownWorker() {
  const worker = new Worker(new URL("./index.worker.ts", import.meta.url), {
    type: "module",
  })
  const expose = new MDWorkerExposeImpl(worker)
  return {
    install: (app: App<Element>) => {
      app.provide(MarkdownWorkerKey, expose)
      app.onUnmount(() => {
        expose.terminate()
      })
    },
  }
}
export function useMarkdownWorker(): MDWorkerExpose {
  const worker = inject(MarkdownWorkerKey)
  if (!worker) {
    throw new Error("useMarkdownWorker() is called outside of setup() or createMarkdownWorker is not called first.")
  }
  return worker
}
