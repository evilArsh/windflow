import { AxiosError } from "axios"
import { serializeError } from "serialize-error"
export function errorToText(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data ?? error.message
  } else {
    const e = serializeError(error)
    if (e instanceof Error && e.message) {
      return e.message
    }
    return JSON.stringify(e)
  }
}
