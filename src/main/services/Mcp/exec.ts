import { errorToText, StatusResponse, responseCode } from "@toolmain/shared"
import { ToolTestParam } from "@shared/types/env"
import { execa, ExecaError } from "execa"
import path from "node:path"
import { useLog } from "@main/hooks/useLog"
import { MCPServiceId } from "./vars"

export async function execCommand(params: ToolTestParam, command: string, ...args: string[]): Promise<StatusResponse> {
  const log = useLog(MCPServiceId)
  try {
    // const res = await execa({ stdout: ["pipe", "inherit"] })`${command}`
    log.debug(`[exec command] ${command} ${args.join(" ")}`)
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
