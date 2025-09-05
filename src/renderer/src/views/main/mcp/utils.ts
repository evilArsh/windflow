import { isArray, isNumber, isObject, isString, isUndefined } from "@toolmain/shared"

export function envToRecord(env: unknown): Record<string, string | number> {
  if (isString(env)) {
    return env
      .split(/[\n\s]+/)
      .filter(Boolean)
      .reduce((prev, cur) => {
        const [key, value] = cur.split("=")
        if (key && value) {
          prev[key] = value
        }
        return prev
      }, {})
  }
  if (isObject(env)) return env
  return {}
}

export function argsToArray(args: unknown): string[] {
  if (isUndefined(args)) return []
  if (isNumber(args) || isString(args))
    return String(args)
      .split(/[\n\s]+/)
      .filter(Boolean)
  if (isArray(args)) return args
  return []
}
