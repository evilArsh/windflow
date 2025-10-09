import { RAGFileStatus, RAGLocalFileInfo, RAGEmbeddingConfig, RAGFile } from "@shared/types/rag"
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
  get: (filePath: string) => TaskInfo | undefined
  set: (filePath: string, meta: TaskInfo) => void
  has: (filePath: string) => boolean
  remove: (filePath: string) => void
  updateStatus: (filePath: string, status: TaskInfoStatus) => boolean
  getLastStatus: (filePath: string) => TaskInfoStatus | undefined
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
