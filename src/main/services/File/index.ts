import { ServiceCore } from "@main/types"
import { Response, responseData, errorToText } from "@toolmain/shared"
import { FileService, IpcChannel } from "@shared/service"
import { dialog, ipcMain } from "electron"
import { useStore } from "@main/hooks/useStore"
import { useEnv } from "@main/hooks/useEnv"
import { useLog } from "@main/hooks/useLog"

export const FileServiceId = "FileService"
export class FileServiceImpl implements FileService, ServiceCore {
  #store = useStore()
  #env = useEnv()
  #log = useLog(FileServiceId)
  async chooseFilePath(): Promise<Response<string>> {
    try {
      const defaultPath = this.#store.get("OpenDefaultPath") ?? this.#env.getRootDir()
      const result = await dialog.showOpenDialog({
        defaultPath,
        properties: ["openFile"],
        filters: [{ name: "All Files", extensions: ["*"] }],
      })
      const res = result.filePaths
      this.#log.debug("[chooseFilePath]", res)
      if (res.length > 0) {
        this.#store.set("OpenDefaultPath", res[0])
        return responseData(200, "success", res[0])
      }
      return responseData(200, "empty", "")
    } catch (error) {
      return responseData(500, errorToText(error), "")
    }
  }
  registerIpc() {
    ipcMain.handle(IpcChannel.FileChooseFilePath, async (_): Promise<Response<string>> => {
      return this.chooseFilePath()
    })
  }
  dispose() {}
}
