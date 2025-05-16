import { ProviderMeta, LLMProvider, LLMBaseRequest, LLMChatRequestHandler, LLMChatResponse } from "@renderer/types"
import { ContentType } from "@shared/code"
import { errorToText } from "@shared/error"
import { AbortError, HttpCodeError } from "./utils"

// FIXME: 完整的 data: {} 会被截断成 data: {...\r\n....},siliconflow:qwen3,deepseek
export async function* readLines(stream: ReadableStream<Uint8Array<ArrayBufferLike>>) {
  try {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder
        .decode(value, { stream: true })
        .split(/\r?\n/)
        .filter(v => !!v)
      for (const line of lines) {
        yield line
      }
    }
  } catch (error) {
    yield errorToText(error)
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
