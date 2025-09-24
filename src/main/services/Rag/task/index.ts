import { EventKey } from "@shared/types/eventbus"
import { RAGLocalFileInfo, RAGFileStatus, RAGEmbeddingConfig } from "@shared/types/rag"
import { EventBus } from "@shared/types/service"
import log from "electron-log"
import { FileProcess } from "./file"
import { ProcessStatus, TaskInfo, TaskInfoStatus, TaskChain, TaskManager } from "./types"
import { Embedding } from "./embedding"
import { cloneDeep } from "@toolmain/shared"

function updateStatus(info: TaskInfo, status: TaskInfoStatus) {
  const index = info.status.findIndex(f => f.taskId === status.taskId)
  if (index < -1) {
    info.status.push(status)
  } else {
    info.status[index] = cloneDeep(status)
  }
}

function getLastStatus(info: TaskInfo) {
  return info.status.length ? info.status[info.status.length - 1] : undefined
}

class ProcessStatusImpl implements ProcessStatus {
  #fileStatus: Map<string, TaskInfo> = new Map()
  get(filePath: string) {
    return this.#fileStatus.get(filePath)
  }
  set(filePath: string, meta: TaskInfo) {
    this.#fileStatus.set(filePath, meta)
  }
  has(filePath: string) {
    return this.#fileStatus.has(filePath)
  }
  remove(filePath: string) {
    this.#fileStatus.delete(filePath)
  }
  updateStatus(filePath: string, status: TaskInfoStatus): boolean {
    const info = this.get(filePath)
    if (info) {
      updateStatus(info, status)
      return true
    }
    return false
  }
  getLastStatus(filePath: string): TaskInfoStatus | undefined {
    const info = this.get(filePath)
    if (!info) return
    return getLastStatus(info)
  }
}

class TaskManagerImpl implements TaskManager {
  #chainLists: TaskChain[]
  #ss: ProcessStatus
  #globalBus: EventBus
  constructor(ss: ProcessStatus, globalBus: EventBus) {
    this.#ss = ss
    this.#globalBus = globalBus
    this.#chainLists = [new FileProcess(this), new Embedding(this)]
  }
  #emitStatus(filePath: string) {
    const s = this.#ss.get(filePath)
    if (!s) return
    this.#globalBus.emit(EventKey.RAGFileProcessStatus, {
      ...s.info,
      status: getLastStatus(s)?.status ?? RAGFileStatus.Failed,
    })
  }
  #getNextChain(task: TaskInfo): TaskChain | undefined {
    if (!this.#chainLists.length) return
    let current = -1
    const lStatus = this.#ss.getLastStatus(task.info.path)
    if (lStatus) {
      current = this.#chainLists.findIndex(ch => ch.taskId() === lStatus.taskId)
    }
    if (current + 1 >= this.#chainLists.length) return
    return this.#chainLists[current + 1]
  }
  async next(task: TaskInfo, status: TaskInfoStatus) {
    if (!this.#ss.has(task.info.path)) {
      throw new Error(`[TaskManager] task ${task.info.path} not exists`)
    }
    this.#ss.updateStatus(task.info.path, status)
    this.#emitStatus(task.info.path)
    const nextChain = this.#getNextChain(task)
    if (!nextChain) {
      log.debug(`[TaskManager] task ${task.info.path} is done`)
      this.#ss.remove(task.info.path)
      return
    }
    nextChain.process(task)
  }
  async process(info: RAGLocalFileInfo, config: RAGEmbeddingConfig) {
    const taskInfo: TaskInfo = {
      info,
      config,
      data: [],
      status: [],
    }
    const chain = this.#getNextChain(taskInfo)
    if (!chain) {
      throw new Error("no task chain found")
    }
    this.#ss.set(info.path, taskInfo)
    this.#ss.updateStatus(info.path, {
      taskId: chain.taskId(),
      status: RAGFileStatus.Pending,
    })
    chain.process(taskInfo)
    this.#emitStatus(info.path)
  }
}

export function createProcessStatus(): ProcessStatus {
  return new ProcessStatusImpl()
}
export function createTaskManager(ss: ProcessStatus, globalBus: EventBus): TaskManager {
  return new TaskManagerImpl(ss, globalBus)
}
