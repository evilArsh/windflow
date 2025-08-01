import { AxiosError } from "axios"
import { serializeError } from "serialize-error"
import rfdc from "rfdc"
import _merge from "lodash.merge"
export function errorToText(error: unknown): string {
  if (typeof error === "string" || typeof error === "number") {
    return String(error)
  }
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

export function useClone() {
  const clone = rfdc()
  function cloneDeep<T extends object>(obj: T): T {
    return clone(obj)
  }
  return { cloneDeep }
}

export const cloneDeep = useClone().cloneDeep

export const merge = _merge
