import {
  RAGEmbeddingConfig,
  RAGFile,
  RAGFileProcessStatus,
  RAGLocalFileMeta,
  RAGLocalFileProcess,
} from "@shared/types/rag"
import pdf from "pdf-parse"
import PQueue from "p-queue"
import MagicString from "magic-string"
import { Tiktoken } from "js-tiktoken/lite"
import cl100k_base from "js-tiktoken/ranks/cl100k_base"
import readline from "node:readline"
import { EventBus } from "@shared/types/service"
import { fileTypeFromFile } from "file-type"
import fs from "node:fs"
import log from "electron-log"
import path from "node:path"
import mime from "mime-types"
import { EventKey } from "@shared/types/eventbus"
import { errorToText, toNumber, uniqueId } from "@toolmain/shared"
import { RAGServiceId } from ".."

/**
https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb

```md
o200k_base  gpt-4o, gpt-4o-mini
cl100k_base gpt-4-turbo, gpt-4, gpt-3.5-turbo, text-embedding-ada-002, text-embedding-3-small, text-embedding-3-large
```
 */
const encoding = new Tiktoken(cl100k_base)
const ErrorFlag = "[ERROR]"
const DoneFlag = "[DONE]"

function useReadLine(stream: fs.ReadStream) {
  const signal = new AbortController()
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  })

  function done(): void {
    signal.abort()
    rl.close()
    !stream.closed && stream.close()
  }
  async function* next(): AsyncGenerator<string> {
    try {
      for await (const line of rl) {
        if (signal.signal?.aborted) {
          yield DoneFlag
        }
        yield line
      }
      yield DoneFlag
    } catch (_e) {
      yield ErrorFlag
    }
  }

  return {
    next,
    done,
  }
}
function useTextReader(config: RAGEmbeddingConfig) {
  let stream: fs.ReadStream | null = null
  const queue = new PQueue({ concurrency: 1 })
  const str = new MagicString("")
  const dst: RAGFile[] = []
  function close() {
    stream?.close()
    stream = null
  }
  function tokenLength(text: string) {
    return encoding.encode(text).length
  }
  async function readFile(meta: RAGLocalFileProcess) {
    close()
    stream = fs.createReadStream(meta.path, {
      encoding: "utf-8",
      flags: "r",
      highWaterMark: 1024 * 1024,
    })
  }
  return {
    readFile,
    close,
  }
}
export function useStatus() {
  const fileStatus: Map<string, RAGLocalFileProcess> = new Map()
  function get(id: string) {
    return fileStatus.get(id)
  }
  function set(id: string, meta: RAGLocalFileProcess) {
    fileStatus.set(id, meta)
  }
  function has(id: string) {
    return fileStatus.has(id)
  }
  function updateStatus(id: string, status: RAGLocalFileProcess["status"]): boolean {
    const file = get(id)
    if (file) {
      file.status = status
      return true
    }
    return false
  }
  function remove(id: string) {
    fileStatus.delete(id)
  }

  return {
    get,
    set,
    has,
    updateStatus,
    remove,
  }
}
export function useFile(globalBus: EventBus) {
  const status = useStatus()

  function extractPDF() {}
  function extractText(data: RAGLocalFileProcess) {}

  async function readFile(meta: RAGLocalFileMeta) {
    try {
      if (fs.existsSync(meta.path)) {
        return
      }
      const stat = fs.statSync(meta.path)
      if (!stat.isFile) {
        return
      }
      if (status.has(meta.id)) {
        return
      }
      const ft = await fileTypeFromFile(meta.path)
      const data: RAGLocalFileProcess = {
        ...meta,
        status: RAGFileProcessStatus.Pending,
        mimeType: ft?.mime || "application/octet-stream",
        fileName: path.basename(meta.path),
        fileSize: stat.size,
      }
      globalBus.emit(EventKey.RAGFileProcessStatus, data)
      status.set(meta.id, data)

      let ext = mime.extension(ft?.mime || "application/octet-stream")
      ext = ext || "bin"
      if (ext === "pdf") {
        // todo
      } else if (ext === "csv") {
        // todo
      } else if (/docx?/.test(ext)) {
        // todo
      } else if (/xlsx?/.test(ext)) {
        // todo
      } else if (/pptx?/.test(ext)) {
        // todo
      } else if (data.mimeType.startsWith("text/") || ["md", "js", "xml"].includes(ext)) {
        extractText(data)
      } else {
        status.updateStatus(meta.id, RAGFileProcessStatus.Failed)
        globalBus.emit(EventKey.RAGFileProcessStatus, data)
      }
    } catch (error) {
      log.error("[RAG readFile error]", error)
      globalBus.emit(EventKey.ServiceLog, {
        id: uniqueId(),
        service: RAGServiceId,
        details: {
          function: "readFile",
          args: meta,
        },
        msg: errorToText(error),
        code: 500,
      })
    }
  }

  return {
    readFile,
  }
}
