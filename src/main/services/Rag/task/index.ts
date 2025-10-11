import { EventKey } from "@shared/types/eventbus"
import { RAGLocalFileInfo, RAGFileStatus, RAGEmbeddingConfig } from "@shared/types/rag"
import { EventBus } from "@shared/service"
import { ProcessStatus, TaskInfo, TaskInfoStatus, TaskChain, TaskManager } from "./types"
import { cloneDeep, errorToText } from "@toolmain/shared"
import { useLog } from "@main/hooks/useLog"
import { RAGServiceId } from ".."

function updateStatus(info: TaskInfo, status: TaskInfoStatus) {
  const index = info.status.findIndex(f => f.taskId === status.taskId)
  if (index < 0) {
    info.status.push(cloneDeep(status))
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
  #log = useLog(RAGServiceId)
  constructor(ss: ProcessStatus, globalBus: EventBus) {
    this.#ss = ss
    this.#globalBus = globalBus
    this.#chainLists = []
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
  addTaskChain(taskChain: TaskChain): void {
    this.#chainLists.push(taskChain)
  }
  async next(task: TaskInfo, status: TaskInfoStatus) {
    try {
      if (!this.#ss.has(task.info.path)) {
        throw new Error(`[TaskManager] task ${task.info.path} not exists`)
      }
      this.#log.debug(`[TaskManager] current task end: `, status)
      this.#ss.updateStatus(task.info.path, status)
      this.#emitStatus(task.info.path)
      if (this.#ss.getLastStatus(task.info.path)?.status === RAGFileStatus.Failed) {
        this.#log.debug(`[TaskManager] task ${task.info.path} is failed`)
        this.#ss.updateStatus(task.info.path, { taskId: "", status: RAGFileStatus.Finish })
        this.#emitStatus(task.info.path)
        this.#ss.remove(task.info.path)
        return
      }
      const nextChain = this.#getNextChain(task)
      if (!nextChain) {
        this.#log.debug(`[TaskManager] task ${task.info.path} is done`)
        this.#ss.updateStatus(task.info.path, { taskId: "", status: RAGFileStatus.Finish })
        this.#emitStatus(task.info.path)
        this.#ss.remove(task.info.path)
        return
      }
      this.#ss.updateStatus(task.info.path, {
        taskId: nextChain.taskId(),
        status: RAGFileStatus.Processing,
      })
      this.#emitStatus(task.info.path)
      this.#log.debug(`[TaskManager] next task start,${nextChain.taskId()}, info: `, task.info, task.config)
      nextChain.process(task)
    } catch (error) {
      this.#log.error("[file process] error", errorToText(error))
      this.#ss.updateStatus(task.info.path, { taskId: "", status: RAGFileStatus.Finish })
      this.#emitStatus(task.info.path)
      this.#ss.remove(task.info.path)
    }
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
      status: RAGFileStatus.Processing,
    })
    this.#emitStatus(info.path)
    this.#log.debug("[process start]", taskInfo)
    chain.process(taskInfo)
  }
  close() {
    this.#chainLists.forEach(chain => {
      chain.close()
    })
  }
}

export function createProcessStatus(): ProcessStatus {
  return new ProcessStatusImpl()
}
export function createTaskManager(ss: ProcessStatus, globalBus: EventBus): TaskManager {
  return new TaskManagerImpl(ss, globalBus)
}
