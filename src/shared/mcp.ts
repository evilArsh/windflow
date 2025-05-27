import { MCPToolDetail, NameSeprator } from "./types/mcp"
import Ajv from "ajv"
import AjvErrors from "ajv-errors"

/**
 * @description 处理listTools,listPrompts,listResources,listResourceTemplates
 * 结果中的`name`字段，用于区分多服务中可能存在同名
 */
export function useToolName() {
  function patch(toolName: string, serverId: string) {
    return `${toolName}${NameSeprator}${serverId}`
  }
  function split(toolName: string) {
    const n = { name: "", serverId: "" }
    const names = toolName.split(NameSeprator).filter(v => !!v)
    if (names.length > 1) {
      n.serverId = names.pop() ?? ""
    }
    n.name = names.join(NameSeprator)
    return n
  }
  return {
    patch,
    split,
  }
}

export function useToolCall() {
  const ajv = new Ajv({
    strict: true, // 强制校验 Schema 本身的合法性
    allErrors: true, // 收集所有错误
    verbose: false,
    formats: {
      uri: true,
      email: true,
      date: true,
      "date-time": true,
      ipv4: true,
      ipv6: true,
      regex: true,
    },
  })
  AjvErrors(ajv)
  /**
   * @description llm返回的函数调用参数处理
   */
  function normalizetoolCallArgs(args: string): string {
    return args.replaceAll("\\", "\\\\")
  }

  /**
   * @description  验证llm返回的函数调用参数
   */
  function validate(tool: MCPToolDetail, args?: Record<string, unknown>): boolean {
    if (!tool.inputSchema) return true
    const validate = ajv.compile(tool.inputSchema)
    return validate(args)
  }
  return {
    validate,
    normalizetoolCallArgs,
  }
}
