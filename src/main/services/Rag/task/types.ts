import { RAGFileStatus, RAGLocalFileInfo, RAGEmbeddingConfig, RAGFile, RAGLocalFileMeta } from "@windflow/shared"
import { HttpStatusCode } from "@toolmain/shared"

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
  /**
   * get `TaskInfo` base on `path` and `topicId`
   */
  get: (meta: RAGLocalFileMeta) => TaskInfo | undefined
  set: (info: TaskInfo) => void
  /**
   * if there's already a `path` under `topicId`
   */
  has: (meta: RAGLocalFileMeta) => boolean
  /**
   * remove  `TaskInfo` base on `path` and `topicId`
   */
  remove: (meta: RAGLocalFileMeta) => void
  /**
   * updateStatus `status` base on `path` and `topicId`
   */
  updateStatus: (meta: RAGLocalFileMeta, status: TaskInfoStatus) => boolean
  /**
   * getLastStatus `status` base on `path` and `topicId`
   */
  getLastStatus: (info: TaskInfo) => TaskInfoStatus | undefined
}

export interface TaskChain {
  taskId(): string
  process(data: TaskInfo, manager: TaskManager): Promise<void>
  /**
   * stop the task, if meta is provided, only stop the task with the same meta, otherwise stop all tasks
   */
  stop: (meta?: RAGLocalFileMeta) => void
}

export interface TaskManager {
  addTaskChain(taskChain: TaskChain): void
  /**
   * when current task chain completed, call next to process next task
   */
  next: (task: TaskInfo, status: TaskInfoStatus) => Promise<void>
  /**
   * start to process task
   */
  process: (info: RAGLocalFileInfo, config: RAGEmbeddingConfig) => Promise<void>
  /**
   * stop the task, if meta is provided, only stop the task with the same meta, otherwise stop all tasks
   */
  stop: (meta?: RAGLocalFileMeta) => void
}

export type EmbeddingResponse = {
  data?: Array<{ embedding: number[] }>
  model: string
  usage?: {
    total_tokens: number
  }
}
export type RerankResponse = {
  id: string
  results: Array<{
    index: number
    relevance_score: number
  }>
}
