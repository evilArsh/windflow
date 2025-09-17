export type RAGEmbeddingConfig = {
  // todo: maybe need a rag processor id, user choose different embedding model to handle data
  embedding: {
    providerName: string
    model: string
    api: string
  }
  rerank?: {
    providerName: string
    model: string
    api: string
  }
  /**
   * dimensions of the embedding vector
   *
   * @default 1024
   */
  dimensions?: number
  /**
   * split text into chunks, the chunks of text must less than `maxChunks`
   *
   * @default 512
   */
  maxChunks?: number
  /**
   * max tokens of each chunk
   *
   * @default 512
   */
  maxTokens?: number
}

export type RAGFile = {
  id: string
  /**
   * current vector of the file's current chunk
   */
  vector: number[]
  /**
   * file id
   */
  fileId: string
  topicId?: string
  content: string
  fileName: string
  fileSize: number
  mimeType: string
  chunkIndex: number
}

export type RAGSearchParam = {
  content: string
}

export type RAGSearchResult = {
  id: string
  score: number
  content: string
  fileId: number
  filename: string
  mimeType: string
}

export interface RAGLocalFileMeta {
  /**
   * file's unique id
   */
  id: string
  /**
   * file's local absolute path
   */
  path: string
  /**
   * specify the scope of current file, if not set,the file will be used for all topics
   */
  topicId?: string
}

export enum RAGFileProcessStatus {
  /**
   * reading file
   */
  Pending = "Pending",
  /**
   * transforming file to vectors
   */
  Processing = "Processing",
  Success = "Success",
  Failed = "Failed",
  NotFound = "NotFound",
}

export interface RAGLocalFileProcess extends RAGLocalFileMeta {
  status: RAGFileProcessStatus
  fileName: string
  fileSize: number
  mimeType: string
}
