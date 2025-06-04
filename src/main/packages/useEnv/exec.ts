import { errorToText } from "@shared/error"
import { BridgeStatusResponse, responseCode } from "@shared/types/bridge"
import { ToolTestParam } from "@shared/types/env"
import { execa, ExecaError } from "execa"
import log from "electron-log"
import path from "node:path"

export async function execCommand(
  params: ToolTestParam,
  command: string,
  ...args: string[]
): Promise<BridgeStatusResponse> {
  try {
    // const res = await execa({ stdout: ["pipe", "inherit"] })`${command}`
    const res = await execa(command, args, {
      stdout: ["pipe", "inherit"],
      preferLocal: false,
    })
    params.msg = res.stdout
    params.status = true
    return responseCode(200)
  } catch (error) {
    log.error("[exec command error]", error)
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

export function resolvePath(pathStr: string): string {
  if (path.isAbsolute(pathStr)) {
    return path.resolve(pathStr)
  }
  return pathStr
}
