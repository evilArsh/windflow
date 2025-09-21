import { RAGLocalFileProcess, RAGFileProcessStatus, RAGFile } from "@shared/types/rag"

export interface ProcessStatus {
  get: (id: string) => RAGLocalFileProcess | undefined
  set: (id: string, meta: RAGLocalFileProcess) => void
  has: (id: string) => boolean
  updateStatus: (id: string, status: RAGFileProcessStatus) => boolean
  remove: (id: string) => void
}

export class ProcessStatusImpl implements ProcessStatus {
  #fileStatus: Map<string, RAGLocalFileProcess> = new Map()
  get(id: string) {
    return this.#fileStatus.get(id)
  }
  set(id: string, meta: RAGLocalFileProcess) {
    this.#fileStatus.set(id, meta)
  }
  has(id: string) {
    return this.#fileStatus.has(id)
  }
  updateStatus(id: string, status: RAGFileProcessStatus): boolean {
    const file = this.get(id)
    if (file) {
      file.status = status
      return true
    }
    return false
  }
  remove(id: string) {
    this.#fileStatus.delete(id)
  }
}
export function createProcessStatus(): ProcessStatus {
  return new ProcessStatusImpl()
}
export type TaskProcessor<T = any> = () => Promise<T>
export interface TaskChain<T> {
  addTask(processor: TaskProcessor<T>): TaskChain<T>
  pipe(nextChain: TaskChain<T>): TaskChain<T>
  next(): AsyncIterator<T>
}

export class FileProcess {}
export class Embedding {}

export class TaskManager {
  addTask(task: RAGLocalFileProcess) {
    return this
  }
  // next(): AsyncIterator<RAGFile> {}
}
