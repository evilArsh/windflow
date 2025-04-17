import { MCPStdioServersParams } from "@shared/types/mcp"
import { platform } from "@electron-toolkit/utils"
import { cloneDeep } from "lodash"

export function modifyPlatformCMD(params: MCPStdioServersParams): MCPStdioServersParams {
  const p = cloneDeep(params)
  if (platform.isWindows) {
    if (p.command === "npx") {
      p.command = "cmd"
      const args = p.args ?? []
      if (!args.includes("-y")) {
        args.unshift("-y")
      }
      p.args = ["/c", "npx", ...args]
    }
  }
  return p
}
