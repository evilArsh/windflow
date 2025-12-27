import {
  RAGLocalFileInfo,
  RAGFileStatus,
  RAGEmbeddingConfig,
  RAGLocalFileMeta,
  EventBus,
  EventKey,
} from "@windflow/shared"
import { ProcessStatus, TaskInfo, TaskInfoStatus, TaskChain, TaskManager } from "./types"
import { cloneDeep, errorToText } from "@toolmain/shared"
import { encapEmbeddinConfig, log } from "../utils"
import { combineUniqueId } from "./utils"

class ProcessStatusImpl implements ProcessStatus {
  #fileStatus: Map<string, TaskInfo> = new Map()
  get(meta: RAGLocalFileMeta) {
    return this.#fileStatus.get(combineUniqueId(meta))
  }
  set(info: TaskInfo) {
    this.#fileStatus.set(combineUniqueId(info.info), info)
  }
  has(meta: RAGLocalFileMeta) {
    return this.#fileStatus.has(combineUniqueId(meta))
  }
  remove(meta: RAGLocalFileMeta) {
    this.#fileStatus.delete(combineUniqueId(meta))
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
  #tmp: ProcessStatus
  #globalBus: EventBus
  constructor(ss: ProcessStatus, globalBus: EventBus) {
    this.#ss = ss
    this.#tmp = createProcessStatus()
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
  #cleanStatus(task: TaskInfo) {
    this.#emitStatus(task)
    this.#ss.remove(task.info)
    // recycling task handle
    const tmpInfo = this.#tmp.get(task.info)
    if (tmpInfo) {
      log.debug(`[TaskManager] task is done, find same task, start processing again.`, task.info)
      this.#tmp.remove(tmpInfo.info)
      this.process(tmpInfo.info, tmpInfo.config)
    }
  }
  addTaskChain(taskChain: TaskChain): void {
    this.#chainLists.push(taskChain)
  }
  async next(task: TaskInfo, status: TaskInfoStatus) {
    try {
      if (!this.#ss.has(task.info)) {
        throw new Error(`[TaskManager] task ${task.info.path} not exists`)
      }
      log.debug(`[TaskManager] current task end: `, status)
      this.#ss.updateStatus(task.info, status)
      // this.#emitStatus(task)
      if (this.#ss.getLastStatus(task)?.status === RAGFileStatus.Failed) {
        log.debug(`[TaskManager] task ${task.info.path} is failed`)
        this.#cleanStatus(task)
        return
      }
      const nextChain = this.#getNextChain(task)
      if (!nextChain) {
        log.debug(`[TaskManager] task ${task.info.path} is done`)
        this.#cleanStatus(task)
        return
      }
      this.#ss.updateStatus(task.info, {
        taskId: nextChain.taskId(),
        status: RAGFileStatus.Processing,
      })
      this.#emitStatus(task)
      log.debug(
        `[TaskManager] next task start, ${nextChain.taskId()}, info: `,
        task.info,
        encapEmbeddinConfig(task.config)
      )
      nextChain.process(task, this)
    } catch (error) {
      log.error("[file process] error", errorToText(error))
      this.#cleanStatus(task)
    }
  }
  async process(info: RAGLocalFileInfo, config: RAGEmbeddingConfig) {
    const taskInfo: TaskInfo = {
      info,
      config,
      data: [],
      status: [],
    }
    if (this.#ss.has(taskInfo.info)) {
      if (this.#tmp.has(taskInfo.info)) {
        log.debug("[process] current taskinfo is already in waiting lists, skip")
      } else {
        log.debug(
          `[process] taskinfo is processing, save it in waiting lists. status: ${this.#ss.get(taskInfo.info)?.status}`
        )
        this.#tmp.set(taskInfo)
      }
      return
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
    log.debug("[process start]", taskInfo.info, encapEmbeddinConfig(taskInfo.config))
    chain.process(taskInfo, this)
  }
  stop(meta?: RAGLocalFileMeta) {
    this.#chainLists.forEach(chain => {
      chain.stop(meta)
    })
  }
}

export function createProcessStatus(): ProcessStatus {
  return new ProcessStatusImpl()
}
export function createTaskManager(ss: ProcessStatus, globalBus: EventBus): TaskManager {
  return new TaskManagerImpl(ss, globalBus)
}
