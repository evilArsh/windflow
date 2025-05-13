import { ProviderMeta, LLMProvider, LLMBaseRequest, LLMChatRequestHandler, LLMChatResponse } from "@renderer/types"
import { ContentType, HttpStatusCode } from "@shared/code"
import { readLines } from "./utils"

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
async function* request(
  body: LLMBaseRequest,
  abortController: AbortController,
  provider: LLMProvider,
  providerMeta: ProviderMeta
): AsyncGenerator<LLMChatResponse> {
  const { apiUrl, apiKey, apiLLMChat } = providerMeta
  const response = await fetch(resolvePath([apiUrl, apiLLMChat.url], false), {
    method: apiLLMChat.method,
    headers: {
      "Content-Type": ContentType.ApplicationJson,
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: abortController.signal,
  })
  if (response.status >= 300) {
    const res = await response.text()
    throw new HttpCodeError(response.status, `HTTP error!,${res}`)
  }
  if (!response.body) {
    throw new Error("response body not found")
  }
  if (body.stream) {
    for await (const line of readLines(response.body)) {
      if (abortController.signal.aborted) {
        throw new AbortError("Request Aborted")
      }
      const parsedData = provider.parseResponse(line, true)
      parsedData.stream = true
      yield parsedData
    }
  } else {
    const data = await response.text()
    yield provider.parseResponse(data, false)
  }
}
export const useSingleLLMChat = (): LLMChatRequestHandler => {
  let abortController: AbortController | undefined
  function chat(
    message: LLMBaseRequest,
    provider: LLMProvider,
    providerMeta: ProviderMeta
  ): AsyncGenerator<LLMChatResponse> {
    terminate()
    abortController = new AbortController()
    return request(message, abortController, provider, providerMeta)
  }
  function terminate() {
    abortController?.abort("Request Aborted")
    abortController = undefined
  }
  return {
    chat,
    terminate,
  }
}
