import { RAGEmbeddingConfig, RAGFile, RAGLocalFileInfo } from "@shared/types/rag"
import { isString, uniqueId } from "@toolmain/shared"
import { Tiktoken, getEncoding } from "js-tiktoken"
/**
https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb

```md
o200k_base  gpt-4o, gpt-4o-mini
cl100k_base gpt-4-turbo, gpt-4, gpt-3.5-turbo, text-embedding-ada-002, text-embedding-3-small, text-embedding-3-large
```
 */
export const encoding: Tiktoken = getEncoding("cl100k_base")

/**
 * 获取文本的token长度
 */
export function tokenLength(text: string) {
  return encoding.encode(text).length
}
/**
 * 文本是否超出token长度限制
 */
export function isMaxTokensReached(text: string, maxTokens: number) {
  return tokenLength(text) > maxTokens
}
/**
 * 文本是否超出chunk长度限制
 */
export function isMaxFileChunksReached(dst: RAGFile[], maxFileChunks: number) {
  return dst.length > maxFileChunks
}
/**
 * 向文件块中添加新的chunk
 */
export function addChunk(dst: RAGFile[], content: string, meta: RAGLocalFileInfo, config: RAGEmbeddingConfig) {
  if (!content) return
  dst.push({
    id: uniqueId(),
    vector: [],
    fileId: meta.id,
    configId: config.id,
    topicId: meta.topicId,
    content,
    fileName: meta.fileName,
    filePath: meta.path,
    fileSize: meta.fileSize,
    mimeType: meta.mimeType,
    chunkIndex: dst.length,
    tokens: tokenLength(content),
  })
}
export function useString() {
  const parts: string[] = []
  let len = 0
  function append(str: string) {
    parts.push(str)
    len += str.length
  }
  function clear() {
    parts.length = 0
    len = 0
  }
  /**
   * default separator is empty string
   */
  function toString(separator = "") {
    return parts.join(separator)
  }
  function length() {
    return len
  }
  function popLast() {
    const latest = parts.pop()
    if (isString(latest)) {
      len -= latest.length
    }
    return latest
  }
  return { append, toString, length, clear, popLast }
}
