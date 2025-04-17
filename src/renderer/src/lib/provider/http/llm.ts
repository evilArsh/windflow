import {
  LLMChatRequestHandler,
  LLMChatResponseHandler,
  ProviderMeta,
  LLMChatResponse,
  LLMProvider,
  LLMBaseRequest,
  Role,
} from "@renderer/types"
import { HttpStatusCode } from "@shared/code"
import { errorToText } from "@shared/error"
import { useEventBus, EventBusKey } from "@vueuse/core"

async function* readLines(stream: ReadableStream<Uint8Array<ArrayBufferLike>>) {
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

export const useLLMChat = (provider: LLMProvider, providerMeta: ProviderMeta): LLMChatRequestHandler => {
  const eventBusKey: EventBusKey<{ reqId: string; message: LLMChatResponse }> = Symbol(`message-${providerMeta.name}`)
  const bus = useEventBus(eventBusKey)
  function chat(message: LLMBaseRequest, callback: (message: LLMChatResponse) => void): LLMChatResponseHandler {
    const cacheMessage: LLMBaseRequest = message
    const reqId = uniqueId()
    let abortController = new AbortController()
    const messageHandler = (event: { reqId: string; message: LLMChatResponse }) => {
      if (event.reqId === reqId) {
        callback(event.message)
      }
    }
    bus.on(messageHandler)
    const doRequest = async (body: LLMBaseRequest, signal: AbortSignal, provider: LLMProvider) => {
      try {
        bus.emit({
          reqId,
          message: {
            status: HttpStatusCode.Continue,
            msg: "",
            content: "",
            stream: cacheMessage.stream,
            role: Role.Assistant,
          },
        })
        const { apiUrl, apiKey, apiLLMChat } = providerMeta
        const response = await fetch(resolvePath([apiUrl, apiLLMChat.url], false), {
          method: apiLLMChat.method,
          headers: {
            "Content-Type": "application/json;charset=utf-8",
            Authorization: `Bearer ${apiKey}`,
          },
          signal: signal,
          body: JSON.stringify(body),
        })
        if (!response.body) {
          throw new Error("response body not found")
        }
        if (body.stream) {
          for await (const line of readLines(response.body)) {
            const parsedData = provider.parseResponse(line)
            parsedData.stream = true
            bus.emit({ reqId, message: parsedData })
          }
        } else {
          const data = await response.json()
          bus.emit({
            reqId,
            message: {
              role: data.choices[0].message.role,
              content: data.choices[0].message.content,
              reasoning_content: data.choices[0].message.reasoning_content ?? "",
              status: HttpStatusCode.Ok,
              stream: false,
              usage: data.usage ?? undefined,
              tool_calls: data.choices[0].message.tool_calls ?? data.choices[0].message.tools ?? undefined,
            },
          })
        }
      } catch (error) {
        bus.emit({
          reqId,
          message: {
            status: HttpStatusCode.Ok,
            msg: "",
            content: errorToText(error),
            stream: body.stream,
            role: Role.Assistant,
          },
        })
      }
    }
    function restart() {
      abortController.abort()
      abortController = new AbortController()
      doRequest(cacheMessage, abortController.signal, provider)
    }
    function terminate() {
      abortController.abort()
    }

    doRequest(cacheMessage, abortController.signal, provider)
    return {
      restart,
      terminate,
    } as LLMChatResponseHandler
  }
  return {
    chat,
  }
}
