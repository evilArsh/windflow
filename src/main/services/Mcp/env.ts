import { Response, errorToText, responseData } from "@toolmain/shared"
import { ToolEnvironment, ToolEnvTestResult } from "@windflow/shared"
import { execa, ExecaError } from "execa"
import path from "node:path"
import { log } from "./vars"
import { getFileInfo } from "@main/misc/file"
import { platform } from "@electron-toolkit/utils"

async function execCommand(command: string, args: string[]): Promise<Response<boolean>> {
  try {
    log.debug(`[exec command] ${command} ${args.join(" ")}`)
    const res = await execa(command, args, {
      stdout: ["pipe", "inherit"],
      preferLocal: false,
    })
    return responseData(200, res.stdout, true)
  } catch (error) {
    log.error("[exec command error]", error)
    if (error instanceof ExecaError) {
      return responseData(500, error.shortMessage ?? error.message ?? error.originalMessage ?? "Unknown error", false)
    } else {
      return responseData(500, errorToText(error), false)
    }
  }
}

function resolvePath(pathStr: string): string {
  if (path.isAbsolute(pathStr)) {
    return path.resolve(pathStr)
  }
  return pathStr
}

async function checkBinPath(pathStr: string) {
  if (path.isAbsolute(pathStr)) {
    const info = await getFileInfo(pathStr)
    if (!info.isFile) {
      throw new Error(`${pathStr} is not a file`)
    }
    if (platform.isWindows) {
      if (info.extension.toLowerCase() !== "exe") {
        throw new Error(`${pathStr} is not a executable file`)
      }
    } else {
      //
    }
  }
}

export async function testEnv(args: ToolEnvironment): Promise<Response<ToolEnvTestResult>> {
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
    log.debug("[testEnv]", args)
    // bun
    await checkBinPath(bun.path)
    const bunVer = await execCommand(resolvePath(bun.path), ["--version"])
    const bunRes = await execCommand(resolvePath(bun.path), [
      "-e",
      "console.log('Hello, Bun!')",
      //
    ])
    data.data.bun.status = bunVer.data && bunRes.data
    data.data.bun.msg = bunVer.msg
    // uv
    await checkBinPath(uv.path)
    const uvVer = await execCommand(resolvePath(uv.path), ["--version"])
    const uvRes = await execCommand(resolvePath(uv.path), [
      "run",
      "python",
      "-c",
      'print("Hello, uv")',
      //
    ])
    data.data.uv.status = uvVer.data && uvRes.data && uvVer.msg.includes("uv")
    data.data.uv.msg = uvVer.msg
    return data
  } catch (error) {
    log.error(error)
    data.code = 500
    data.msg = errorToText(error)
    return data
  }
}
