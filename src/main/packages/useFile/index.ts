import { ServiceCore } from "@main/types"
import { errorToText } from "@shared/error"
import { BridgeResponse, responseData } from "@shared/types/bridge"
import { FileService, IpcChannel } from "@shared/types/service"
import { dialog, ipcMain } from "electron"
import log from "electron-log"

export default (): FileService & ServiceCore => {
  async function chooseFilePath(): Promise<BridgeResponse<string>> {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "All Files", extensions: ["*"] }],
      })
      const res = result.filePaths
      log.debug("[chooseFilePath]", res)
      if (res.length > 0) {
        return responseData(200, "success", res[0])
      }
      return responseData(200, "empty", "")
    } catch (error) {
      return responseData(500, errorToText(error), "")
    }
  }
  function registerIpc() {
    ipcMain.handle(IpcChannel.FileChooseFilePath, async (_): Promise<BridgeResponse<string>> => {
      return chooseFilePath()
    })
  }
  function dispose() {}
  return {
    chooseFilePath,
    registerIpc,
    dispose,
  }
}
