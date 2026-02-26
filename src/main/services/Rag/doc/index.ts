import { RAGEmbeddingConfig, RAGFile, RAGLocalFileInfo } from "@windflow/shared"
import { errorToText, isSymbol, Response, responseData, toNumber } from "@toolmain/shared"
import path from "node:path"

import {
  DataTransformer,
  useCsvTransformer,
  useDocxTransformer,
  useImageTransformer,
  usePdfTransformer,
  useTextTransformer,
  useXlsxTransformer,
  // useXlsxTransformer2,
} from "./transformer"
import { isMaxTokensExceed, addChunk, useString } from "./utils"
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
    const maxTokens = toNumber(config.maxTokens)
    if (maxTokens >= 0 && isMaxTokensExceed(line, maxTokens)) {
      log.info(`[pushLine] max tokens reached of single line, Split the line into smaller parts`)
      pushLine(line.substring(0, line.length / 2), meta)
      pushLine(line.substring(line.length / 2), meta)
    } else {
      gStr.append(line)
    }
  }
  async function read(meta: RAGLocalFileInfo, transformer: DataTransformer) {
    for await (const line of transformer.next()) {
      try {
        if (isSymbol(line) || gDst.length === toNumber(config.maxFileChunks)) {
          transformer.done()
          break
        }
        pushLine(line, meta)
        const prev: string[] = []
        const strs = gStr.slice()
        let flag = 0
        const maxTokens = toNumber(config.maxTokens)
        for (let i = 0; i < strs.length; i++) {
          if (maxTokens >= 0 && isMaxTokensExceed(prev.concat(strs[i]).join(""), maxTokens)) {
            // FIXME: this will truncate the strings.
            // if it's a base64 image, it will be incomplete
            addChunk(gDst, prev.join(""), meta, config)
            flag += prev.length
            prev.length = 0
            prev.push(strs[i])
            if (gDst.length === toNumber(config.maxFileChunks)) {
              break
            }
          } else {
            prev.push(strs[i])
          }
        }
        if (prev.length) {
          addChunk(gDst, prev.join(""), meta, config)
          flag += prev.length
        }
        gStr.truncate(0, flag)
      } catch (error) {
        log.debug("[read file error]", errorToText(error))
        transformer.done()
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
      if (gDst.length >= toNumber(config.maxFileChunks)) {
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
    } else if (mimeType?.startsWith("image/")) {
      transformer = useImageTransformer(data.path)
      return responseData(200, "ok", await reader.read(data, transformer))
    } else {
      return responseData(500, `file type ${data.mimeType} not supported`, [])
    }
  } finally {
    transformer?.done()
    reader.clear()
  }
}
