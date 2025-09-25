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
  next: (task: TaskInfo, status: TaskInfoStatus) => Promise<void>
  process: (info: RAGLocalFileInfo, config: RAGEmbeddingConfig) => Promise<void>
  close: () => void
}
