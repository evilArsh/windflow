import Ajv, { ErrorObject } from "ajv"
import AjvErrors from "ajv-errors"
// import addFormats from "ajv-formats"
/**
 * @description llm返回的函数调用参数处理
 */
export function normalizetoolCallArgs(args: string): string {
  return args.replaceAll("\\", "\\\\")
}
export function useSchemaValidate() {
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
  function validate(
    inputSchema: Record<string, unknown>,
    args?: Record<string, unknown>
  ): [boolean, Array<ErrorObject> | null | undefined] {
    if (!inputSchema) return [true, null]
    const validate = ajv.compile(inputSchema)
    const valid = validate(args)
    return [valid, validate.errors]
  }
  return {
    validate,
  }
}
