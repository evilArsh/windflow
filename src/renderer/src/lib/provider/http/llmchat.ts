import {
  ProviderMeta,
  LLMProvider,
  LLMBaseRequest,
  Role,
  LLMChatRequestHandler,
  LLMChatResponse,
} from "@renderer/types"
import { ContentType, HttpStatusCode } from "@shared/code"
import { errorToText } from "@shared/error"
import { readLines } from "./utils"
async function* request(
  body: LLMBaseRequest,
  abortController: AbortController,
  provider: LLMProvider,
  providerMeta: ProviderMeta
): AsyncGenerator<LLMChatResponse> {
  try {
    yield { status: 100, content: "", stream: body.stream, role: Role.Assistant }
    const { apiUrl, apiKey, apiLLMChat } = providerMeta
    const response = await fetch(resolvePath([apiUrl, apiLLMChat.url], false), {
      method: apiLLMChat.method,
      headers: {
        "Content-Type": ContentType.ApplicationJson,
        Authorization: `Bearer ${apiKey}`,
      },
      signal: abortController.signal,
      body: JSON.stringify(body),
    })
    if (response.status >= 300) {
      const res = await response.text()
      throw new Error(`HTTP error!,${res}`)
    }
    if (!response.body) {
      throw new Error("response body not found")
    }
    if (body.stream) {
      for await (const line of readLines(response.body)) {
        if (abortController.signal.aborted) {
          // TODO: 处理流中断
        }
        const parsedData = provider.parseResponse(line)
        parsedData.stream = true
        yield parsedData
      }
    } else {
      const data = await response.json()
      yield {
        role: data.choices[0].message.role,
        content: data.choices[0].message.content,
        reasoning_content: data.choices[0].message.reasoning_content ?? "",
        status: HttpStatusCode.Ok,
        stream: false,
        usage: data.usage ?? undefined,
        tool_calls: data.choices[0].message.tool_calls ?? data.choices[0].message.tools ?? undefined,
      }
    }
  } catch (error) {
    console.log("[LLMChat error]", error)
    yield {
      status: HttpStatusCode.Ok,
      content: errorToText(error),
      stream: body.stream,
      role: Role.Assistant,
    }
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
    abortController?.abort()
    abortController = undefined
  }
  return {
    chat,
    terminate,
  }
}
