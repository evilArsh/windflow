import { RAGEmbeddingConfig, RAGFile, RAGLocalFileInfo } from "@shared/types/rag"
import mime from "mime-types"
import { isSymbol, Response, responseData } from "@toolmain/shared"
import {
  DataTransformer,
  useCsvTransformer,
  useDocxTransformer,
  usePdfTransformer,
  useTextTransformer,
  useXlsxTransformer,
} from "./transformer"
import { isMaxTokensReached, addChunk, isMaxFileChunksReached } from "./utils"

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
  return { append, toString, length, clear }
}

export function useTextReader(config: RAGEmbeddingConfig) {
  const str = useString()
  const dst: RAGFile[] = []
  async function read(meta: RAGLocalFileInfo, transformer: DataTransformer) {
    const pushLine = (line: string) => {
      if (isMaxTokensReached(str.toString(), config)) {
        addChunk(dst, str.toString(), meta)
        str.clear()
      }
      str.append(line)
      if (isMaxTokensReached(str.toString(), config)) {
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
  const ext = mime.extension(data.mimeType) || "bin"
  const reader = useTextReader(config)
  let transformer: DataTransformer<string | symbol> | null = null
  try {
    if (ext === "pdf") {
      transformer = usePdfTransformer(data.path)
      const res = await reader.read(data, usePdfTransformer(data.path))
      return responseData(200, "ok", res)
    } else if (ext === "csv") {
      transformer = useCsvTransformer(data.path)
      const res = await reader.read(data, useCsvTransformer(data.path))
      return responseData(200, "ok", res)
    } else if (/docx?/.test(ext)) {
      transformer = useDocxTransformer(data.path)
      const res = await reader.read(data, useDocxTransformer(data.path))
      return responseData(200, "ok", res)
    } else if (/xlsx?/.test(ext)) {
      transformer = useXlsxTransformer(data.path)
      const res = await reader.read(data, useXlsxTransformer(data.path))
      return responseData(200, "ok", res)
    } else if (data.mimeType.startsWith("text/") || ["md", "js", "xml"].includes(ext)) {
      transformer = useTextTransformer(data.path)
      const res = await reader.read(data, useTextTransformer(data.path))
      return responseData(200, "ok", res)
    } else {
      return responseData(500, `file type ${data.mimeType} not supported`, [])
    }
  } finally {
    transformer?.done()
  }
}
