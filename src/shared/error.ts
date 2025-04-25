import { AxiosError } from "axios"
import { serializeError } from "serialize-error"
export function errorToText(error: unknown): string {
  if (error instanceof AxiosError) {
    return JSON.stringify(error.response?.data) ?? error.message
  } else {
    if (error instanceof Error && error.message) {
      return error.message
    }
    const e = serializeError(error)
    return JSON.stringify(e)
  }
}
