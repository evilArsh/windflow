import readline from "node:readline"
import fs from "node:fs"
import { RAGEmbeddingConfig, RAGFile, RAGLocalFileProcess } from "@shared/types/rag"
import { toNumber, uniqueId } from "@toolmain/shared"
import { encoding } from "./utils"

const Flags = {
  Error: "[ERROR]",
  Done: "[DONE]",
}
function useString() {
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
  function toString() {
    return parts.join("")
  }
  function length() {
    return len
  }
  return { append, toString, length, clear }
}
function useReadLine(stream: fs.ReadStream) {
  let signal: AbortController | null = null
  let rl: readline.Interface | null = null
  function done(): void {
    signal?.abort()
    rl?.close()
    !stream.closed && stream.close()
    signal = null
    rl = null
  }
  async function* next(): AsyncGenerator<string> {
    try {
      if (stream.closed) {
        yield Flags.Done
      }
      if (!rl) {
        rl = readline.createInterface({
          input: stream,
          crlfDelay: Infinity,
        })
      }
      if (!signal) {
        signal = new AbortController()
      }
      for await (const line of rl) {
        if (signal.signal.aborted) {
          yield Flags.Done
        }
        yield line
      }
      yield Flags.Done
    } catch (_e) {
      yield Flags.Error
    }
  }

  return {
    next,
    done,
  }
}
export function useTextReader(config: RAGEmbeddingConfig) {
  let stream: fs.ReadStream | null = null
  const str = useString()
  const dst: RAGFile[] = []
  function close() {
    stream?.close()
    stream = null
  }
  function tokenLength(text: string) {
    return encoding.encode(text).length
  }
  function isMaxTokensReached(text: string) {
    return tokenLength(text) >= toNumber(config.maxTokens)
  }
  function addNewChunk(content: string, meta: RAGLocalFileProcess) {
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
  async function readFile(meta: RAGLocalFileProcess) {
    close()
    stream = fs.createReadStream(meta.path, {
      encoding: "utf-8",
      flags: "r",
      highWaterMark: 1024 * 1024,
    })
    const { done, next } = useReadLine(stream)
    for await (const line of next()) {
      if (line !== Flags.Done && line !== Flags.Error) {
        if (dst.length >= toNumber(config.maxChunks)) {
          done()
          break
        }
        if (isMaxTokensReached(str.toString())) {
          addNewChunk(str.toString(), meta)
          str.clear()
        }
        str.append(line)
        if (isMaxTokensReached(str.toString())) {
          str.clear()
          str.append(line)
        }
      } else {
        done()
        break
      }
    }
    return dst
  }
  function getData() {
    return dst
  }
  return {
    readFile,
    getData,
    close,
  }
}
