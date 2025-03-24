import { AxiosError } from "axios"

export function errorToText(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  } else if (error instanceof AxiosError) {
    return error.response?.data ?? error.message
  }
  return String(error)
}
