import { RAGFileProcessStatus, RAGLocalFileMeta, RAGLocalFileProcess } from "@shared/types/rag"
import { EventBus } from "@shared/types/service"
import { fileTypeFromFile } from "file-type"
import fs from "node:fs"
import log from "electron-log"
import path from "node:path"
import mime from "mime-types"
import { EventKey } from "@shared/types/eventbus"
import { isString } from "@toolmain/shared"
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
  const ctx = useStatus()

  async function readFile(meta: RAGLocalFileMeta) {
    try {
      if (fs.existsSync(meta.path)) {
        return
      }
      const stat = fs.statSync(meta.path)
      if (!stat.isFile) {
        return
      }
      if (ctx.has(meta.id)) {
        return
      }
      const ft = await fileTypeFromFile(meta.path)
      const ext = mime.extension(ft?.mime || "application/octet-stream")
      const data: RAGLocalFileProcess = {
        ...meta,
        status: RAGFileProcessStatus.Pending,
        mimeType: isString(ext) ? ext : "unknown",
        fileName: path.basename(meta.path),
        fileSize: stat.size,
      }
      globalBus.emit(EventKey.RAGFileProcessStatus, data)
      ctx.set(meta.id, data)
    } catch (error) {
      log.error("[RAG readFile error]", error)
    }
  }

  return {
    readFile,
  }
}
