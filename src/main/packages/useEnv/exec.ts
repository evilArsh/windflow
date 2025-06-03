import { errorToText } from "@shared/error"
import { BridgeStatusResponse, responseCode } from "@shared/types/bridge"
import { ToolTestParam } from "@shared/types/env"
import { execa, ExecaError } from "execa"

export async function execCommand(params: ToolTestParam, command: string): Promise<BridgeStatusResponse> {
  try {
    const res = await execa({ stdout: ["pipe", "inherit"] })`${command}`
    params.msg = res.stdout
    params.status = true
    return responseCode(200)
  } catch (error) {
    params.status = false
    if (error instanceof ExecaError) {
      params.msg = error.shortMessage ?? error.message ?? error.originalMessage ?? "Unknown error"
      return responseCode(500)
    } else {
      params.msg = errorToText(error)
      return responseCode(500)
    }
  }
}
