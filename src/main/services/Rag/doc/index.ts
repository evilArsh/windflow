import { RAGEmbeddingConfig, RAGFile, RAGLocalFileInfo } from "@shared/types/rag"
import mime from "mime-types"
import { isString, isSymbol, Response, responseData } from "@toolmain/shared"
import { fileTypeFromFile } from "file-type"
import { detectXml } from "@file-type/xml"
import path from "node:path"

import {
  DataTransformer,
  useCsvTransformer,
  useDocxTransformer,
  usePdfTransformer,
  useTextTransformer,
  useXlsxTransformer,
} from "./transformer"
import { isMaxTokensReached, addChunk, isMaxFileChunksReached } from "./utils"
import { useLog } from "@main/hooks/useLog"
import { RAGServiceId } from ".."
export function detectFileTypeByExtension(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  const textExtensions = [".txt", ".md"]
  if (textExtensions.includes(ext)) {
    return { ext: "txt", mime: "text/plain" }
  }
  return null
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
  function toString() {
    return parts.join("")
  }
  function length() {
    return len
  }
  function popLast() {
    const latest = parts.pop()
    if (isString(latest)) {
      len -= latest.length
    }
  }
  return { append, toString, length, clear, popLast }
}

export function useTextReader(config: RAGEmbeddingConfig) {
  const str = useString()
  const dst: RAGFile[] = []
  async function read(meta: RAGLocalFileInfo, transformer: DataTransformer) {
    const pushLine = (line: string) => {
      if (isMaxTokensReached(str.toString(), config)) {
        addChunk(dst, str.toString(), meta, config)
        str.clear()
      }
      str.append(line)
      if (isMaxTokensReached(str.toString(), config)) {
        str.popLast()
        addChunk(dst, str.toString(), meta, config)
        str.clear()
        str.append(line)
      }
    }
    for await (const line of transformer.next()) {
      if (isMaxFileChunksReached(dst, config)) {
        transformer.done()
        break
      }
      if (!isSymbol(line)) {
        pushLine(line)
      } else {
        pushLine("")
        transformer.done()
        if (!isMaxTokensReached(str.toString(), config) && !isMaxFileChunksReached(dst, config)) {
          addChunk(dst, str.toString(), meta, config)
        }
        break
      }
    }
    return dst
  }
  return {
    read,
  }
}

export async function readFile(data: RAGLocalFileInfo, config: RAGEmbeddingConfig): Promise<Response<RAGFile[]>> {
  const log = useLog(RAGServiceId)
  const ft = await fileTypeFromFile(data.path, { customDetectors: [detectXml] })
  if (ft) {
    data.mimeType = ft.mime
  } else {
    data.mimeType = mime.lookup(data.path) || "application/octet-stream"
  }
  const ext = mime.extension(data.mimeType) || "bin"
  const reader = useTextReader(config)
  let transformer: DataTransformer<string | symbol> | null = null
  log.debug(`[start readFile] ext: ${ext}, mimeType: ${data.mimeType}, path: ${data.path}`)
  try {
    let resp: Response<RAGFile[]>
    if (ext === "pdf") {
      transformer = usePdfTransformer(data.path)
      const res = await reader.read(data, usePdfTransformer(data.path))
      resp = responseData(200, "ok", res)
    } else if (ext === "csv") {
      transformer = useCsvTransformer(data.path)
      const res = await reader.read(data, useCsvTransformer(data.path))
      resp = responseData(200, "ok", res)
    } else if (/docx?/.test(ext)) {
      transformer = useDocxTransformer(data.path)
      const res = await reader.read(data, useDocxTransformer(data.path))
      resp = responseData(200, "ok", res)
    } else if (/xlsx?/.test(ext)) {
      transformer = useXlsxTransformer(data.path)
      const res = await reader.read(data, useXlsxTransformer(data.path))
      resp = responseData(200, "ok", res)
    } else if (data.mimeType.startsWith("text/") || ["md", "js", "xml"].includes(ext)) {
      transformer = useTextTransformer(data.path)
      const res = await reader.read(data, useTextTransformer(data.path))
      resp = responseData(200, "ok", res)
    } else {
      resp = responseData(500, `file type ${data.mimeType} not supported`, [])
    }
    return resp
  } finally {
    transformer?.done()
  }
}
