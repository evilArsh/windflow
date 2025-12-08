import { HttpStatusCode } from "@toolmain/shared"

export class AbortError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AbortError"
  }
}
export class HttpCodeError extends Error {
  #code: HttpStatusCode
  constructor(code: HttpStatusCode, message: string) {
    super(message)
    this.#code = code
    this.name = "HttpCodeError"
  }
  code() {
    return this.#code
  }
}
