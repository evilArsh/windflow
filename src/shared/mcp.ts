import { MCPToolDetail } from "./types/mcp"
import Ajv, { ErrorObject } from "ajv"
import AjvErrors from "ajv-errors"
// import addFormats from "ajv-formats"

export function useToolCall() {
  const ajv = new Ajv({
    coerceTypes: true,
    // strict: true,
    allErrors: true,
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
  // addFormats(ajv)
  /**
   * @description llm返回的函数调用参数处理
   */
  function normalizetoolCallArgs(args: string): string {
    return args.replaceAll("\\", "\\\\")
  }

  /**
   * @description  验证llm返回的函数调用参数
   */
  function validate(
    tool: MCPToolDetail,
    args?: Record<string, unknown>
  ): [boolean, Array<ErrorObject> | null | undefined] {
    if (!tool.inputSchema) return [true, null]
    const validate = ajv.compile(tool.inputSchema)
    const valid = validate(args)
    return [valid, validate.errors]
  }
  return {
    validate,
    normalizetoolCallArgs,
  }
}
