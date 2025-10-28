import { EventKey } from "@shared/types/eventbus"
import { RAGLocalFileInfo, RAGFileStatus, RAGEmbeddingConfig, RAGLocalFileMeta } from "@shared/types/rag"
import { EventBus } from "@shared/service"
import { ProcessStatus, TaskInfo, TaskInfoStatus, TaskChain, TaskManager } from "./types"
import { cloneDeep, errorToText } from "@toolmain/shared"
import { useLog } from "@main/hooks/useLog"
import { RAGServiceId } from "../vars"

class ProcessStatusImpl implements ProcessStatus {
  #fileStatus: Map<string, TaskInfo> = new Map()
  #conbineUniqueId(meta: RAGLocalFileMeta) {
    return `$_${meta.topicId}_${meta.path}`
  }
  get(meta: RAGLocalFileMeta) {
    return this.#fileStatus.get(this.#conbineUniqueId(meta))
  }
  set(info: TaskInfo) {
    this.#fileStatus.set(this.#conbineUniqueId(info.info), info)
  }
  has(meta: RAGLocalFileMeta) {
    return this.#fileStatus.has(this.#conbineUniqueId(meta))
  }
  remove(meta: RAGLocalFileMeta) {
    this.#fileStatus.delete(this.#conbineUniqueId(meta))
  }
  updateStatus(meta: RAGLocalFileMeta, status: TaskInfoStatus): boolean {
    const info = this.get(meta)
    if (info) {
      const index = info.status.findIndex(f => f.taskId === status.taskId)
      if (index < 0) {
        info.status.push(cloneDeep(status))
      } else {
        info.status[index] = cloneDeep(status)
      }
      return true
    }
    return false
  }
  getLastStatus(info: TaskInfo): TaskInfoStatus | undefined {
    return info.status.length ? info.status[info.status.length - 1] : undefined
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
  #emitStatus(info: TaskInfo) {
    const status = this.#ss.getLastStatus(info)
    this.#globalBus.emit(EventKey.RAGFileProcessStatus, {
      ...info.info,
      status: status?.status,
      code: status?.code,
      msg: status?.msg,
    })
  }
  #getNextChain(task: TaskInfo): TaskChain | undefined {
    if (!this.#chainLists.length) return
    let current = -1
    const lStatus = this.#ss.getLastStatus(task)
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
      if (!this.#ss.has(task.info)) {
        throw new Error(`[TaskManager] task ${task.info.path} not exists`)
      }
      this.#log.debug(`[TaskManager] current task end: `, status)
      this.#ss.updateStatus(task.info, status)
      this.#emitStatus(task)
      if (this.#ss.getLastStatus(task)?.status === RAGFileStatus.Failed) {
        this.#log.debug(`[TaskManager] task ${task.info.path} is failed`)
        this.#emitStatus(task)
        this.#ss.remove(task.info)
        return
      }
      const nextChain = this.#getNextChain(task)
      if (!nextChain) {
        this.#log.debug(`[TaskManager] task ${task.info.path} is done`)
        this.#emitStatus(task)
        this.#ss.remove(task.info)
        return
      }
      this.#ss.updateStatus(task.info, {
        taskId: nextChain.taskId(),
        status: RAGFileStatus.Processing,
      })
      this.#emitStatus(task)
      this.#log.debug(`[TaskManager] next task start,${nextChain.taskId()}, info: `, task.info, task.config)
      nextChain.process(task)
    } catch (error) {
      this.#log.error("[file process] error", errorToText(error))
      this.#emitStatus(task)
      this.#ss.remove(task.info)
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
    this.#ss.set(taskInfo)
    this.#ss.updateStatus(info, {
      taskId: chain.taskId(),
      status: RAGFileStatus.Processing,
    })
    this.#emitStatus(taskInfo)
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
