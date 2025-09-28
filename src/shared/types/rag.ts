import { Method } from "@toolmain/shared"
export type RAGEmbeddingConfig = {
  id: string
  embedding: {
    providerName: string
    model: string
    api: string
    apiKey?: string
    /**
     * @default post
     */
    method?: Method
  }
  rerank?: {
    providerName: string
    model: string
    api: string
    apiKey?: string
    /**
     * @default post
     */
    method?: Method
  }
  /**
   * dimensions of the embedding vector
   *
   * @default 1024
   */
  dimensions?: number
  /**
   * max tokens of each chunk
   *
   * @default 512
   */
  maxTokens?: number
  /**
   * max inputs length when using embedding
   * @default 20
   */
  maxInputs?: number
  /**
   * split text into chunks, the chunks of text must less than `maxFileChunks`
   *
   * @default 512
   */
  maxFileChunks?: number
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
  mimeType?: string
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

export enum RAGFileStatus {
  Processing = "Processing",
  Success = "Success",
  Failed = "Failed",
  /**
   * indicate the whole tasks are finished
   */
  Finish = "Finish",
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

export interface RAGLocalFileInfo extends RAGLocalFileMeta {
  fileName: string
  fileSize: number
  mimeType?: string
}
