import { ServiceCore } from "@main/types"
import { Response, responseData, errorToText, StatusResponse, responseCode, isString } from "@toolmain/shared"
import { FileService, IpcChannel } from "@shared/service"
import { dialog, ipcMain, shell } from "electron"
import { useStore } from "@main/hooks/useStore"
import { useEnv } from "@main/hooks/useEnv"
import { FileInfo } from "@shared/types/files"
import { getFileInfo } from "@main/misc/file"
import path from "node:path"
import fs from "node:fs"
import { log } from "./utils"

export class FileServiceImpl implements FileService, ServiceCore {
  #store = useStore()
  #env = useEnv()
  async chooseFilePath(): Promise<Response<string[]>> {
    try {
      const defaultPath = this.#store.get("OpenDefaultPath") ?? this.#env.getRootDir()
      const result = await dialog.showOpenDialog({
        defaultPath,
        properties: ["openFile", "multiSelections", "dontAddToRecent"],
        filters: [{ name: "All Files", extensions: ["*"] }],
      })
      const res = result.filePaths
      log.debug("[chooseFilePath]", res)
      if (res.length > 0) {
        this.#store.set("OpenDefaultPath", res[0])
        return responseData(200, "success", res)
      }
      return responseData(200, "empty", [])
    } catch (error) {
      return responseData(500, errorToText(error), [])
    }
  }
  async getInfo(absPath: string[]): Promise<Response<FileInfo[]>> {
    const res: FileInfo[] = []
    try {
      for (const path of absPath) {
        const info = await getFileInfo(path)
        res.push(info)
      }
      return responseData(200, "ok", res)
    } catch (error) {
      log.error("[getInfo]", errorToText(error))
      return responseData(500, errorToText(error), res)
    }
  }
  async open(absPath: string): Promise<StatusResponse> {
    try {
      if (!absPath || !isString(absPath)) {
        return responseCode(400, "404 Not Found")
      }
      const normalizedPath = path.resolve(absPath)
      try {
        fs.accessSync(normalizedPath)
      } catch {
        return responseCode(400, `permission denied`)
      }
      const stats = fs.statSync(normalizedPath)
      if (stats.isDirectory()) {
        shell.showItemInFolder(normalizedPath)
        return responseCode(200, "ok")
      } else if (stats.isFile()) {
        const errorMessage = await shell.openPath(normalizedPath)
        if (errorMessage) {
          return responseCode(500, errorMessage)
        }
        return responseCode(200, "ok")
      } else {
        return responseCode(400, `bad request`)
      }
    } catch (error) {
      return responseCode(500, errorToText(error))
    }
  }
  registerIpc() {
    ipcMain.handle(IpcChannel.FileChooseFilePath, async (_): Promise<Response<string[]>> => {
      return this.chooseFilePath()
    })
    ipcMain.handle(IpcChannel.FileGetInfo, async (_, p: string[]): Promise<Response<FileInfo[]>> => {
      return this.getInfo(p)
    })
    ipcMain.handle(IpcChannel.FileOpen, async (_, p: string): Promise<StatusResponse> => {
      return this.open(p)
    })
  }
  dispose() {}
}
