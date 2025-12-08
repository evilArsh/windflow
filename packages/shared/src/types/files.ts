export type FileInfo = {
  name: string
  path: string
  extension: string
  isFile: boolean
  isDirectory: boolean
  size: number
  mimeType?: string
  atime?: number // 访问时间
  mtime?: number // 修改时间
  ctime?: number // 状态更改时间
  birthtime?: number // 创建时间
  // lastModified: number
}
