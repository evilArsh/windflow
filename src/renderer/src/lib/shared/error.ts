import { AxiosError } from "axios"

export function errorToText(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  } else if (error instanceof AxiosError) {
    return error.response?.data ?? error.message
  }
  return String(error)
}

export function dataToText(data: unknown): string {
  if (typeof data === "string") {
    return data
  } else if (isObject(data)) {
    return JSON.stringify(data)
  }
  return String(data)
}
