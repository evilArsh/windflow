import { RAGEmbeddingConfig, RAGFile, RAGLocalFileInfo } from "@shared/types/rag"
import { errorToText, isSymbol, Response, responseData, toNumber } from "@toolmain/shared"
import path from "node:path"

import {
  DataTransformer,
  useCsvTransformer,
  useDocxTransformer,
  usePdfTransformer,
  useTextTransformer,
  useXlsxTransformer,
  // useXlsxTransformer2,
} from "./transformer"
import { isMaxTokensReached, addChunk, isMaxFileChunksReached, useString } from "./utils"
import { log } from "../utils"
export function detectFileTypeByExtension(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  const textExtensions = [".txt", ".md"]
  if (textExtensions.includes(ext)) {
    return { ext: "txt", mime: "text/plain" }
  }
  return null
}
export function useTextReader(config: RAGEmbeddingConfig) {
  const gStr = useString()
  const gDst: RAGFile[] = []
  function pushLine(line: string, meta: RAGLocalFileInfo) {
    if (isMaxTokensReached(line, toNumber(config.maxTokens))) {
      throw new Error("max tokens reached of single line")
    }
    if (isMaxTokensReached(gDst.toString(), toNumber(config.maxFileChunks))) {
      throw new Error("max tokens reached of original chunk")
    }
    gStr.append(line)
    if (isMaxTokensReached(gStr.toString(), toNumber(config.maxTokens))) {
      const last = gStr.popLast()
      addChunk(gDst, gStr.toString(), meta, config)
      gStr.clear()
      last && gStr.append(last)
    }
  }
  async function read(meta: RAGLocalFileInfo, transformer: DataTransformer) {
    for await (const line of transformer.next()) {
      try {
        if (isMaxFileChunksReached(gDst, toNumber(config.maxFileChunks))) {
          transformer.done()
          break
        }
        if (!isSymbol(line)) {
          pushLine(line, meta)
        } else {
          // the final chunk should be flush to gDst
          pushLine("", meta)
          transformer.done()
          if (
            !isMaxTokensReached(gStr.toString(), toNumber(config.maxTokens)) &&
            !isMaxFileChunksReached(gDst, toNumber(config.maxFileChunks))
          ) {
            addChunk(gDst, gStr.toString(), meta, config)
          }
          break
        }
      } catch (error) {
        log.debug("[read file error]", errorToText(error))
        break
      }
    }
    return Array.from(gDst)
  }
  /**
   * readBlock assumes that the token length of each block has reached the maximum value that is less than `config.maxTokens`.
   *
   * it's useful when you handle the token by yourself
   */
  async function readBlock(meta: RAGLocalFileInfo, transformer: DataTransformer) {
    for await (const block of transformer.next()) {
      if (isMaxFileChunksReached(gDst, toNumber(config.maxFileChunks))) {
        transformer.done()
        break
      }
      if (!isSymbol(block)) {
        addChunk(gDst, block, meta, config)
      } else {
        transformer.done()
        break
      }
    }
    return Array.from(gDst)
  }
  function clear() {
    gStr.clear()
    gDst.length = 0
  }
  return {
    read,
    readBlock,
    clear,
  }
}

export async function readFile(data: RAGLocalFileInfo, config: RAGEmbeddingConfig): Promise<Response<RAGFile[]>> {
  const mimeType = data.mimeType
  const ext = data.extension ?? ""
  const reader = useTextReader(config)
  let transformer: DataTransformer<string | symbol> | null = null
  log.debug(`[start readFile] ext: ${ext}, mimeType: ${mimeType}, path: ${data.path}`)
  try {
    if (ext === "pdf") {
      transformer = usePdfTransformer(data.path)
      return responseData(200, "ok", await reader.read(data, transformer))
    } else if (ext === "csv") {
      transformer = useCsvTransformer(data.path)
      return responseData(200, "ok", await reader.read(data, transformer))
    } else if (/docx?/.test(ext)) {
      transformer = useDocxTransformer(data.path)
      return responseData(200, "ok", await reader.read(data, transformer))
    } else if (/xlsx?/.test(ext)) {
      // transformer = useXlsxTransformer2(data.path, {
      //   maxTokens: toNumber(config.maxTokens),
      // })
      // return responseData(200, "ok", await reader.readBlock(data, transformer))
      transformer = useXlsxTransformer(data.path)
      return responseData(200, "ok", await reader.read(data, transformer))
    } else if (mimeType?.startsWith("text/")) {
      transformer = useTextTransformer(data.path)
      return responseData(200, "ok", await reader.read(data, transformer))
    } else {
      return responseData(500, `file type ${data.mimeType} not supported`, [])
    }
  } finally {
    transformer?.done()
    reader.clear()
  }
}
