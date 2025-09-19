import { RAGEmbeddingConfig, RAGFile, RAGLocalFileProcess } from "@shared/types/rag"
import { isSymbol } from "@toolmain/shared"
import { addChunk, isMaxChunksReached, isMaxTokensReached, useString } from "./utils"
import { DataTransformer } from "./transformer"

export function useReader(config: RAGEmbeddingConfig) {
  const str = useString()
  const dst: RAGFile[] = []
  async function readFile(meta: RAGLocalFileProcess, transformer: DataTransformer) {
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
      if (isMaxChunksReached(dst, config)) {
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
    readFile,
  }
}
