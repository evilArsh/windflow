import { MCPStdioServerParam } from "@shared/types/mcp"
import { platform } from "@electron-toolkit/utils"
import { cloneDeep } from "lodash-es"

export function modifyPlatformCMD(param: MCPStdioServerParam): MCPStdioServerParam {
  const p = cloneDeep(param)
  if (platform.isWindows) {
    if (p.params.command === "npx") {
      p.params.command = "cmd"
      const args = p.params.args ?? []
      if (!args.includes("-y")) {
        args.unshift("-y")
      }
      p.params.args = ["/c", "npx", ...args]
    }
  }
  return p
}
