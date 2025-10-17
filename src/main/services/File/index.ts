import { ServiceCore } from "@main/types"
import { Response, responseData, errorToText } from "@toolmain/shared"
import { FileService, IpcChannel } from "@shared/service"
import { dialog, ipcMain } from "electron"
import { useStore } from "@main/hooks/useStore"
import { useEnv } from "@main/hooks/useEnv"
import { useLog } from "@main/hooks/useLog"
import { FileInfo } from "@shared/types/files"
import { getFileInfo } from "@main/misc/file"

export const FileServiceId = "FileService"
export class FileServiceImpl implements FileService, ServiceCore {
  #store = useStore()
  #env = useEnv()
  #log = useLog(FileServiceId)
  async chooseFilePath(): Promise<Response<string[]>> {
    try {
      const defaultPath = this.#store.get("OpenDefaultPath") ?? this.#env.getRootDir()
      const result = await dialog.showOpenDialog({
        defaultPath,
        properties: ["openFile", "multiSelections", "dontAddToRecent"],
        filters: [{ name: "All Files", extensions: ["*"] }],
      })
      const res = result.filePaths
      this.#log.debug("[chooseFilePath]", res)
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
      this.#log.error("[getInfo]", errorToText(error))
      return responseData(500, errorToText(error), res)
    }
  }
  registerIpc() {
    ipcMain.handle(IpcChannel.FileChooseFilePath, async (_): Promise<Response<string[]>> => {
      return this.chooseFilePath()
    })
    ipcMain.handle(IpcChannel.FileGetInfo, async (_, p: string[]): Promise<Response<FileInfo[]>> => {
      return this.getInfo(p)
    })
  }
  dispose() {}
}
