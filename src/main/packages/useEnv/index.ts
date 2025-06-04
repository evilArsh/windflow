import { ServiceCore } from "@main/types"
import { BridgeResponse, BridgeStatusResponse } from "@shared/types/bridge"
import { ToolEnvironment, ToolEnvTestResult } from "@shared/types/env"
import { EnvService, IpcChannel } from "@shared/types/service"
import { ipcMain } from "electron"
import { execCommand, resolvePath } from "./exec"
import { errorToText } from "@shared/error"
// import log from "electron-log"
export default (): EnvService & ServiceCore => {
  async function testEnv(args: ToolEnvironment): Promise<BridgeResponse<ToolEnvTestResult>> {
    const data: BridgeResponse<ToolEnvTestResult> = {
      code: 200,
      msg: "ok",
      data: {
        uv: { status: false },
        bun: { status: false },
      },
    }
    try {
      const { uv, bun } = args
      // log.debug("[testEnv]", args)
      const req: Array<Promise<BridgeStatusResponse>> = [
        execCommand(data.data.uv, resolvePath(uv.path), "--version"),
        execCommand(data.data.bun, resolvePath(bun.path), "--version"),
      ]
      await Promise.all(req)
      return data
    } catch (error) {
      data.code = 500
      data.msg = errorToText(error)
      return data
    }
  }
  function registerIpc() {
    ipcMain.handle(IpcChannel.EnvTestEnv, async (_, args: ToolEnvironment) => {
      return testEnv(args)
    })
  }
  function dispose() {}
  return {
    testEnv,

    registerIpc,
    dispose,
  }
}
