import { app } from "electron"
import path from "node:path"
import fs from "node:fs"

export function useEnv() {
  const rootDirName = ".windflow"
  let rootPath = path.resolve(app.getPath("userData"), rootDirName)
  /**
   * @param create if not exists, create it
   */
  function setRootDir(dir: string, create?: boolean) {
    rootPath = dir
    if (create && !fs.existsSync(rootPath)) {
      fs.mkdirSync(rootPath, { recursive: true })
    }
  }
  function getRootDir() {
    return rootPath
  }
  /**
   * concatenate `dir` after current root directory
   */
  function resolveDir(dir: string) {
    return path.resolve(getRootDir(), dir)
  }
  function init() {
    if (!fs.existsSync(getRootDir())) {
      fs.mkdirSync(getRootDir(), { recursive: true })
    }
  }

  return {
    init,

    setRootDir,
    getRootDir,
    resolveDir,
  }
}
