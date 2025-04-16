import { HttpStatusCode } from "../code"

export interface BridgeResponse<T = unknown> {
  code: HttpStatusCode
  msg: string
  data: T
}
export type BridgeStatusResponse = BridgeResponse<undefined>
export function responseCode(code: HttpStatusCode, msg?: string): BridgeStatusResponse {
  return {
    code,
    msg: msg ?? "",
    data: undefined,
  }
}
export function responseData<T>(code: HttpStatusCode, msg: string, data: T): BridgeResponse<T> {
  return { code, msg, data }
}
export function code1xx(code: HttpStatusCode) {
  return code >= 100 && code < 200
}
export function code2xx(code: HttpStatusCode) {
  return code >= 200 && code < 300
}
export function code3xx(code: HttpStatusCode) {
  return code >= 300 && code < 400
}
export function code4xx(code: HttpStatusCode) {
  return code >= 400 && code < 500
}
export function code5xx(code: HttpStatusCode) {
  return code >= 500 && code <= 511
}
