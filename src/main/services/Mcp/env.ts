import { Response, StatusResponse, errorToText } from "@toolmain/shared"
import { ToolEnvironment, ToolEnvTestResult } from "@shared/types/env"
import { execCommand, resolvePath } from "./exec"
import { useLog } from "@main/hooks/useLog"
import { MCPServiceId } from "."
export const mcpEnv = () => {
  async function testEnv(args: ToolEnvironment): Promise<Response<ToolEnvTestResult>> {
    const data: Response<ToolEnvTestResult> = {
      code: 200,
      msg: "ok",
      data: {
        uv: { status: false },
        bun: { status: false },
      },
    }
    try {
      const { uv, bun } = args
      const log = useLog(MCPServiceId)
      log.debug("[testEnv]", args)
      const req: Array<Promise<StatusResponse>> = [
        execCommand(data.data.bun, resolvePath(bun.path), "--version"),
        execCommand(data.data.uv, resolvePath(uv.path), "--version"),
      ]
      await Promise.all(req)
      return data
    } catch (error) {
      data.code = 500
      data.msg = errorToText(error)
      return data
    }
  }
  return {
    testEnv,
  }
}
