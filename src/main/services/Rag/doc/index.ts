import { RAGEmbeddingConfig, RAGFile, RAGLocalFileProcess } from "@shared/types/rag"
import mime from "mime-types"
import { Response, responseData } from "@toolmain/shared"
import { useReader } from "./reader"
import {
  useCsvTransformer,
  useDocxTransformer,
  usePdfTransformer,
  useTextTransformer,
  useXlsxTransformer,
} from "./transformer"

export function useFile() {
  async function extractXlsx(conf: RAGEmbeddingConfig, data: RAGLocalFileProcess) {
    const tReader = useReader(conf)
    const transformer = useXlsxTransformer(data)
    try {
      const res = await tReader.readFile(data, transformer)
      return res
    } finally {
      transformer.done()
    }
  }
  async function extractDocx(conf: RAGEmbeddingConfig, data: RAGLocalFileProcess) {
    const tReader = useReader(conf)
    const transformer = useDocxTransformer(data)
    try {
      const res = await tReader.readFile(data, transformer)
      return res
    } finally {
      transformer.done()
    }
  }
  async function extractPDF(conf: RAGEmbeddingConfig, data: RAGLocalFileProcess) {
    const tReader = useReader(conf)
    const transformer = usePdfTransformer(data)
    try {
      const res = await tReader.readFile(data, transformer)
      return res
    } finally {
      transformer.done()
    }
  }
  async function extractText(conf: RAGEmbeddingConfig, data: RAGLocalFileProcess) {
    const tReader = useReader(conf)
    const transformer = useTextTransformer(data)
    try {
      const res = await tReader.readFile(data, transformer)
      return res
    } finally {
      transformer.done()
    }
  }
  async function extractCsv(conf: RAGEmbeddingConfig, data: RAGLocalFileProcess) {
    const tReader = useReader(conf)
    const transformer = useCsvTransformer(data)
    try {
      const res = await tReader.readFile(data, transformer)
      return res
    } finally {
      transformer.done()
    }
  }

  async function readFile(config: RAGEmbeddingConfig, data: RAGLocalFileProcess): Promise<Response<RAGFile[]>> {
    const ext = mime.extension(data.mimeType) || "bin"
    if (ext === "pdf") {
      return responseData(200, "ok", await extractPDF(config, data))
    } else if (ext === "csv") {
      return responseData(200, "ok", await extractCsv(config, data))
    } else if (/docx?/.test(ext)) {
      return responseData(200, "ok", await extractDocx(config, data))
    } else if (/xlsx?/.test(ext)) {
      return responseData(200, "ok", await extractXlsx(config, data))
    } else if (data.mimeType.startsWith("text/") || ["md", "js", "xml"].includes(ext)) {
      return responseData(200, "ok", await extractText(config, data))
    } else {
      return responseData(500, `file type ${data.mimeType} not supported`, [])
    }
  }

  return {
    readFile,
  }
}
