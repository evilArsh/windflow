import { RAGEmbeddingConfig, RAGFileProcessStatus, RAGLocalFileMeta, RAGLocalFileProcess } from "@shared/types/rag"
import pdf from "pdf-parse"

import { EventBus } from "@shared/types/service"
import { fileTypeFromFile } from "file-type"
import fs from "node:fs"
import log from "electron-log"
import path from "node:path"
import mime from "mime-types"
import { EventKey } from "@shared/types/eventbus"
import { errorToText, uniqueId } from "@toolmain/shared"
import { RAGServiceId } from ".."
import { useTextReader } from "./textReader"

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
  async function extractText(conf: RAGEmbeddingConfig, data: RAGLocalFileProcess) {
    const tReader = useTextReader(conf)
    return tReader.readFile(data)
  }

  async function readFile(config: RAGEmbeddingConfig, meta: RAGLocalFileMeta) {
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
        const chunks = await extractText(config, data)
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
