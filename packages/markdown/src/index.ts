import { App, InjectionKey } from "vue"
import { EventBus, isNull, useEvent } from "@toolmain/shared"
import { MDWorkerExpose, MDWorkerMessage, MDWorkerMessageCore } from "./types"
import MDWorker from "./index.worker.ts?worker"

export * from "./parser"
export * from "./types"
export * from "./utils"
export * from "./vue/types"
export * from "./vue/index"
export const MarkdownWorkerKey: InjectionKey<MDWorkerExpose> = Symbol("MarkdownWorker")

class MDWorkerExposeImpl implements MDWorkerExpose {
  #worker: Worker
  #event: EventBus<Record<string, any>>
  #pendingMessages: MDWorkerMessage[]
  #animationFrameId: number | null = null

  constructor(worker: Worker) {
    this.#worker = worker
    this.#event = useEvent()
    this.#pendingMessages = []
    this.#worker.addEventListener("message", (e: MessageEvent<MDWorkerMessage>) => {
      this.#pendingMessages.push(e.data)
      if (isNull(this.#animationFrameId)) {
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
  const worker = new MDWorker()
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
