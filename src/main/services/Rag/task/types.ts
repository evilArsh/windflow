import { RAGFileStatus, RAGLocalFileInfo, RAGEmbeddingConfig, RAGFile, RAGLocalFileMeta } from "@shared/types/rag"
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
  process(data: TaskInfo): Promise<void>
  close: () => void
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
   * close all tasks
   */
  close: () => void
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
