import { EventKey } from "@shared/types/eventbus"
import { RAGLocalFileInfo, RAGFileStatus, RAGEmbeddingConfig, RAGFile } from "@shared/types/rag"
import { EventBus } from "@shared/types/service"
import PQueue from "p-queue"
import { readFile } from "../doc"
import { cloneDeep, code4xx, code5xx, errorToText, HttpStatusCode } from "@toolmain/shared"

export interface TaskInfoStatus {
  taskId: string
  status: RAGFileStatus
  code?: HttpStatusCode
  msg?: string
}
export interface TaskInfo {
  info: RAGLocalFileInfo
  config: RAGEmbeddingConfig
  data: RAGFile[]
  status: TaskInfoStatus[]
}

export interface ProcessStatus {
  get: (id: string) => TaskInfo | undefined
  set: (id: string, meta: TaskInfo) => void
  has: (id: string) => boolean
  remove: (id: string) => void
  updateStatus: (id: string, status: TaskInfoStatus) => boolean
  getLastStatus: (id: string) => RAGFileStatus | undefined
}
function updateStatus(info: TaskInfo, status: TaskInfoStatus) {
  const index = info.status.findIndex(f => f.taskId === status.taskId)
  if (index < -1) {
    info.status.push(status)
  } else {
    info.status[index] = cloneDeep(status)
  }
}
function getLastStatus(info: TaskInfo) {
  return info.status.length ? info.status[info.status.length - 1].status : undefined
}
export class ProcessStatusImpl implements ProcessStatus {
  #fileStatus: Map<string, TaskInfo> = new Map()
  get(id: string) {
    return this.#fileStatus.get(id)
  }
  set(id: string, meta: TaskInfo) {
    this.#fileStatus.set(id, meta)
  }
  has(id: string) {
    return this.#fileStatus.has(id)
  }
  remove(id: string) {
    this.#fileStatus.delete(id)
  }
  updateStatus(id: string, status: TaskInfoStatus): boolean {
    const info = this.get(id)
    if (info) {
      updateStatus(info, status)
      return true
    }
    return false
  }
  getLastStatus(id: string): RAGFileStatus | undefined {
    const info = this.get(id)
    if (!info) return
    return getLastStatus(info)
  }
}
export function createProcessStatus(): ProcessStatus {
  return new ProcessStatusImpl()
}
export interface TaskChain {
  getId(): string
  process(data: TaskInfo): Promise<void>
}

class Embedding implements TaskChain {
  #manager: TaskManager
  #queue: PQueue
  constructor(manager: TaskManager) {
    this.#manager = manager
    this.#queue = new PQueue({ concurrency: 5 })
  }
  getId() {
    return "task-embedding"
  }
  async process(task: TaskInfo) {
    this.#queue.add(async () => {
      this.#manager.next(task)
    })
  }
}

class FileProcess implements TaskChain {
  #manager: TaskManager
  #queue: PQueue
  constructor(manager: TaskManager) {
    this.#manager = manager
    this.#queue = new PQueue({ concurrency: 5 })
  }
  getId() {
    return "task-fileProcess"
  }
  async process(info: TaskInfo) {
    this.#queue.add(async () => {
      const statusResp: TaskInfoStatus = {
        taskId: this.getId(),
        status: RAGFileStatus.Processing,
      }
      try {
        const chunksData = await readFile(info.info, info.config)
        if (code4xx(chunksData.code) || code5xx(chunksData.code)) {
          statusResp.status = RAGFileStatus.Failed
          statusResp.msg = chunksData.msg
          statusResp.code = chunksData.code
        } else {
          info.data = chunksData.data
          statusResp.status = RAGFileStatus.Success
          statusResp.msg = "ok"
          statusResp.code = 200
        }
      } catch (error) {
        statusResp.status = RAGFileStatus.Failed
        statusResp.msg = errorToText(error)
        statusResp.code = 500
      } finally {
        info.status.push(statusResp)
        this.#manager.next(info)
      }
    })
  }
}

export class TaskManager {
  #chainLists: TaskChain[]
  #ss: ProcessStatus
  #globalBus: EventBus
  #status: TaskInfoStatus[] = []
  constructor(ss: ProcessStatus, globalBus: EventBus) {
    this.#ss = ss
    this.#globalBus = globalBus
    this.#chainLists = [new FileProcess(this), new Embedding(this)]
  }
  #emitStatus(ssId: string) {
    const s = this.#ss.get(ssId)
    if (!s) return
    this.#globalBus.emit(EventKey.RAGFileProcessStatus, {
      ...s.info,
      status: getLastStatus(s) ?? RAGFileStatus.Failed,
    })
  }
  #getNextChain(task: TaskInfo): TaskChain | undefined {
    if (!this.#chainLists.length) return
    const current = this.#chainLists.findIndex(ch => ch.getId() === task.taskId)
    if (current + 1 >= this.#chainLists.length) return
    return this.#chainLists[current + 1]
  }
  async next(task: TaskInfo) {}
  async process(task: TaskInfo) {
    if (this.#ss.has(task.info.id)) {
      throw new Error(`[process] task already exists,status: ${this.#ss.get(task.info.id)?.status}`)
    }
    this.#ss.set(task.info.id, cloneDeep(task))
    const chain = this.#getNextChain(task)
    this.#emitStatus(task.info.id)
    // if (task.info.status === RAGFileProcessStatus.Failed) {
    //   return
    // }
  }
}
