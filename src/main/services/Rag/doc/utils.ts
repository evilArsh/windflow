import { RAGEmbeddingConfig, RAGFile, RAGLocalFileProcess } from "@shared/types/rag"
import { isUndefined, toNumber, uniqueId } from "@toolmain/shared"
import { Tiktoken } from "js-tiktoken/lite"
import cl100k_base from "js-tiktoken/ranks/cl100k_base"
import { Readable } from "node:stream"

/**
https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb

```md
o200k_base  gpt-4o, gpt-4o-mini
cl100k_base gpt-4-turbo, gpt-4, gpt-3.5-turbo, text-embedding-ada-002, text-embedding-3-small, text-embedding-3-large
```
 */
export const encoding = new Tiktoken(cl100k_base)

/**
 * 获取文本的token长度
 */
export function tokenLength(text: string) {
  return encoding.encode(text).length
}
/**
 * 文本是否达到token长度限制
 */
export function isMaxTokensReached(text: string, config: RAGEmbeddingConfig) {
  return tokenLength(text) >= toNumber(config.maxTokens)
}
/**
 * 文本是否达到chunk长度限制
 */
export function isMaxChunksReached(dst: RAGFile[], config: RAGEmbeddingConfig) {
  return dst.length >= toNumber(config.maxChunks)
}
/**
 * 向文件块中添加新的chunk
 */
export function addChunk(dst: RAGFile[], content: string, meta: RAGLocalFileProcess) {
  if (!content) return
  dst.push({
    id: uniqueId(),
    vector: [],
    fileId: meta.id,
    content,
    fileName: meta.fileName,
    fileSize: meta.fileSize,
    mimeType: meta.mimeType,
    chunkIndex: dst.length,
  })
}

// FIXME: 官方支持？
export function streamToAsyncIterator<T = any>(stream: Readable): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      const maxBufferSize = 512
      const minBufferSize = 32
      const values: T[] = []
      let ended = false
      stream
        .on("data", (data: T) => {
          values.push(data)
          if (values.length >= maxBufferSize) {
            stream.pause()
          }
        })
        .on("end", () => {
          ended = true
        })
        .on("error", _ => {
          ended = true
        })

      return {
        next: (): Promise<IteratorResult<T>> => {
          const data = values.shift()
          if (ended || isUndefined(data)) {
            return Promise.resolve({ value: data, done: true })
          }
          if (values.length <= minBufferSize) {
            stream.resume()
          }
          return Promise.resolve({ value: data, done: false })
        },
      }
    },
  }
}
