import { app } from "electron"
import path from "node:path"
import fs from "node:fs"

export function useEnv() {
  const rootDirName = ".windflow"
  function getRootDir() {
    return path.resolve(app.getPath("userData"), rootDirName)
  }

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

    getRootDir,
    resolveDir,
  }
}
