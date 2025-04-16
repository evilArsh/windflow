import { AxiosError } from "axios"
import { serializeError } from "serialize-error"
export function errorToText(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data ?? error.message
  } else {
    return JSON.stringify(serializeError(error))
  }
}
