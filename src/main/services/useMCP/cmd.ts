import { platform } from "@electron-toolkit/utils"
import { cloneDeep } from "lodash-es"
import { ToolEnvironment } from "@shared/types/env"
import { MCPServerParam } from "@shared/types/mcp"

export function modifyPlatformCMD(env: ToolEnvironment, param: MCPServerParam): MCPServerParam {
  const p = cloneDeep(param)
  if (platform.isWindows) {
    const command = p.params.command.toLowerCase().trim()
    if (command === "npx") {
      p.params.command = env.bun.path.trim()
      const args = p.params.args ?? []
      if (!args.includes("-y")) {
        args.unshift("-y")
      }
      if (!args.includes("x")) {
        args.unshift("x")
      }
      if (env.npm.registry) {
        p.params.env["NPM_CONFIG_REGISTRY"] = env.npm.registry
      }
      p.params.args = args
    } else if (command === "uvx" || command === "uv") {
      p.params.command = env.uv.path.trim()
      const args = p.params.args ?? []
      args.unshift("run")
      args.unshift("tool")
      if (env.python.registry) {
        p.params.env["UV_DEFAULT_INDEX"] = env.python.registry
        p.params.env["PIP_INDEX_URL"] = env.python.registry
      }
      p.params.args = args
    }
  }
  return p
}
