import { ProviderMeta, LLMChatResponse, LLMProvider, LLMBaseRequest, Role } from "@renderer/types"
import { HttpStatusCode } from "@shared/code"
import { errorToText } from "@shared/error"
import { useEventBus, EventBusKey, UseEventBusReturn } from "@vueuse/core"
import { readLines } from "./utils"

// type BusMessage = {
//   reqId: string
//   message: LLMChatResponse
// }
type BusMessage = LLMChatResponse
const uniqueBusKey = (id: string): EventBusKey<BusMessage> => Symbol(`message-${id}`)
// async function request(
//   reqId: string,
//   body: LLMBaseRequest,
//   signal: AbortSignal,
//   eventBus: UseEventBusReturn<BusMessage, BusMessage>,
//   provider?: LLMProvider,
//   providerMeta?: ProviderMeta
// ) {
//   try {
//     if (!(provider && providerMeta)) {
//       eventBus.emit({
//         reqId,
//         message: {
//           status: 500,
//           content: "provider or providerMeta not found",
//           stream: body.stream,
//           role: Role.Assistant,
//         },
//       })
//       return
//     }
//     eventBus.emit({
//       reqId,
//       message: {
//         status: 100,
//         content: "",
//         stream: body.stream,
//         role: Role.Assistant,
//       },
//     })
//     const { apiUrl, apiKey, apiLLMChat } = providerMeta
//     const response = await fetch(resolvePath([apiUrl, apiLLMChat.url], false), {
//       method: apiLLMChat.method,
//       headers: {
//         "Content-Type": "application/json;charset=utf-8",
//         Authorization: `Bearer ${apiKey}`,
//       },
//       signal: signal,
//       body: JSON.stringify(body),
//     })
//     if (!response.body) {
//       throw new Error("response body not found")
//     }
//     if (body.stream) {
//       for await (const line of readLines(response.body)) {
//         const parsedData = provider.parseResponse(line)
//         parsedData.stream = true
//         eventBus.emit({ reqId, message: parsedData })
//       }
//     } else {
//       const data = await response.json()
//       eventBus.emit({
//         reqId,
//         message: {
//           role: data.choices[0].message.role,
//           content: data.choices[0].message.content,
//           reasoning_content: data.choices[0].message.reasoning_content ?? "",
//           status: HttpStatusCode.Ok,
//           stream: false,
//           usage: data.usage ?? undefined,
//           tool_calls: data.choices[0].message.tool_calls ?? data.choices[0].message.tools ?? undefined,
//         },
//       })
//     }
//   } catch (error) {
//     eventBus.emit({
//       reqId,
//       message: {
//         status: HttpStatusCode.Ok,
//         content: errorToText(error),
//         stream: body.stream,
//         role: Role.Assistant,
//       },
//     })
//   }
// }
async function* request(
  body: LLMBaseRequest,
  signal: AbortSignal,
  provider?: LLMProvider,
  providerMeta?: ProviderMeta
) {
  try {
    if (!(provider && providerMeta)) {
      yield {
        status: 500,
        content: "provider or providerMeta not found",
        stream: body.stream,
        role: Role.Assistant,
      }
      return
    }
    yield {
      status: 100,
      content: "",
      stream: body.stream,
      role: Role.Assistant,
    }
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
    yield {
      status: HttpStatusCode.Ok,
      content: errorToText(error),
      stream: body.stream,
      role: Role.Assistant,
    }
  }
}
export const useLLMChat = () => {
  const eventBusKey = uniqueBusKey(uniqueId())
  const bus = useEventBus(eventBusKey)
  let provider: LLMProvider | undefined
  let providerMeta: ProviderMeta | undefined
  function update(newProvider: LLMProvider, newProviderMeta: ProviderMeta) {
    provider = newProvider
    providerMeta = newProviderMeta
  }
  function chat(message: LLMBaseRequest): {
    terminate: () => void
    data: AsyncGenerator<BusMessage>
  } {
    const reqId = uniqueId()
    const abortController = new AbortController()
    // const messageHandler = (event: { reqId: string; message: LLMChatResponse }) => {
    //   if (event.reqId === reqId) {
    //     callback(event.message)
    //   }
    // }
    // bus.on(messageHandler)
    // async function restart() {
    //   if (abortController) {
    //     abortController.abort()
    //   }
    //   abortController = new AbortController()
    //   await request(reqId, message, abortController.signal, bus, provider, providerMeta)
    // }
    // function dispose() {
    //   bus.off(messageHandler)
    // }
    // restart()
    const data = request(message, abortController.signal, provider, providerMeta)
    return {
      terminate: () => {
        abortController.abort()
      },
      data,
    }
  }
  return {
    chat,
    update,
  }
}
