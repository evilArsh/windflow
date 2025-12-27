import { FileInfo } from "@windflow/shared"
import fs from "node:fs"
import path from "node:path"
import { fileTypeFromFile } from "file-type"
import { detectXml } from "@file-type/xml"
import mime from "mime-types"

export async function getFileInfo(filePath: string): Promise<FileInfo> {
  const stat = fs.statSync(filePath)
  const info: FileInfo = {
    path: filePath,
    name: path.basename(filePath),
    size: stat.size,
    isDirectory: stat.isDirectory(),
    isFile: stat.isFile(),
    atime: stat.atimeMs, // 访问时间
    mtime: stat.mtimeMs, // 修改时间
    ctime: stat.ctimeMs, // 状态更改时间
    birthtime: stat.birthtimeMs, // 创建时间
    extension: "",
  }
  const ft = await fileTypeFromFile(filePath, { customDetectors: [detectXml] })
  if (ft) {
    info.mimeType = ft.mime
    info.extension = ft.ext
  } else {
    info.mimeType = mime.lookup(info.path) || ""
    info.extension = mime.extension(info.mimeType) || ""
  }
  return info
}
