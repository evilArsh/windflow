import {
  LLMChatRequestHandler,
  LLMChatResponseHandler,
  ProviderMeta,
  LLMChatResponse,
  LLMProvider,
  LLMBaseRequest,
  Role,
} from "@renderer/types"
import { useEventBus, EventBusKey } from "@vueuse/core"
import { HttpStatusCode } from "./code"

async function* readLines(stream: ReadableStream<Uint8Array<ArrayBufferLike>>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      yield line
    }
  }
  if (buffer) yield buffer // 最后一行
}

export const useLLMChat = (provider: LLMProvider, providerMeta: ProviderMeta): LLMChatRequestHandler => {
  const eventBusKey: EventBusKey<{ reqId: string; message: LLMChatResponse }> = Symbol(`message-${providerMeta.name}`)
  const bus = useEventBus(eventBusKey)
  function chat(
    message: LLMBaseRequest,
    stream: boolean,
    callback: (message: LLMChatResponse) => void
  ): LLMChatResponseHandler {
    const cacheMessage: LLMBaseRequest = message
    const reqId = uniqueId()
    let abortController = new AbortController()
    const messageHandler = (event: { reqId: string; message: LLMChatResponse }) => {
      if (event.reqId === reqId) {
        callback(event.message)
      }
    }
    bus.on(messageHandler)
    const doRequest = async (signal: AbortSignal, provider: LLMProvider) => {
      try {
        bus.emit({
          reqId,
          message: { status: HttpStatusCode.Continue, msg: "", content: "", stream, role: Role.Assistant },
        })
        const { apiUrl, apiKey, apiLLMChat } = providerMeta
        const response = await fetch(resolvePath([apiUrl, apiLLMChat.url], false), {
          method: apiLLMChat.method,
          headers: {
            "Content-Type": "application/json;charset=utf-8",
            Authorization: `Bearer ${apiKey}`,
          },
          signal: signal,
          body: JSON.stringify(cacheMessage),
        })
        if (!response.body) {
          throw new Error("response body not found")
        }
        for await (const line of readLines(response.body)) {
          const parsedData = provider.parseResponse(line)
          parsedData.stream = stream
          bus.emit({ reqId, message: parsedData })
        }
      } catch (error) {
        console.log(error)
        bus.emit({
          reqId,
          message: {
            status: HttpStatusCode.Ok,
            msg: "",
            content: errorToText(error),
            stream,
            role: Role.Assistant,
          },
        })
      }
    }
    function restart() {
      abortController.abort()
      abortController = new AbortController()
      bus.on(messageHandler)
      doRequest(abortController.signal, provider)
    }
    function terminate() {
      abortController.abort()
    }

    doRequest(abortController.signal, provider)
    return {
      restart,
      terminate,
    } as LLMChatResponseHandler
  }
  return {
    chat,
  }
}

// import {
//   LLMChatRequestHandler,
//   LLMChatResponseHandler,
//   ProviderMeta,
//   LLMChatResponse,
//   LLMProvider,
//   LLMBaseRequest,
//   Role,
// } from "@renderer/types"
// import { useEventBus, EventBusKey } from "@vueuse/core"
// import { AxiosError, AxiosInstance, CanceledError, HttpStatusCode } from "axios"
// export const useLLMChat = (
//   instance: AxiosInstance,
//   provider: LLMProvider,
//   providerMeta: ProviderMeta
// ): LLMChatRequestHandler => {
//   const eventBusKey: EventBusKey<{ reqId: string; message: LLMChatResponse }> = Symbol(`message-${providerMeta.name}`)
//   const bus = useEventBus(eventBusKey)

//   function chat(message: LLMBaseRequest, callback: (message: LLMChatResponse) => void): LLMChatResponseHandler {
//     const cacheMessage: LLMBaseRequest = message
//     const reqId = uniqueId()
//     let abortController = new AbortController()
//     const messageHandler = (event: { reqId: string; message: LLMChatResponse }) => {
//       if (event.reqId === reqId) {
//         callback(event.message)
//       }
//     }
//     bus.on(messageHandler)
//     const doRequest = (signal: AbortSignal, provider: LLMProvider) => {
//       bus.emit({
//         reqId,
//         message: { status: HttpStatusCode.Continue, msg: "", content: "", reasoningContent: "", role: Role.Assistant },
//       })
//       const { url, method } = providerMeta.apiLLMChat
//       let prevLen = 0 // 已接收到的字符长度
//       instance
//         .request({
//           url: url,
//           method: method,
//           signal: signal,
//           data: cacheMessage,
//           onDownloadProgress: event => {
//             const status = event.event?.target?.status
//             if (status == HttpStatusCode.Ok) {
//               const currentText: string = event.event?.target?.responseText ?? ""
//               const newText = currentText.slice(prevLen)
//               prevLen = currentText.length
//               const res = provider.parseResponse(newText)
//               bus.emit({ reqId, message: res })
//             } else {
//               bus.emit({ reqId, message: { status, msg: "", content: "", reasoningContent: "", role: Role.Assistant } })
//             }
//           },
//         })
//         .then(() => {
//           console.log("[request finish]")
//           bus.emit({
//             reqId,
//             message: {
//               status: HttpStatusCode.Ok,
//               msg: "finish",
//               content: "",
//               reasoningContent: "",
//               role: Role.Assistant,
//             },
//           })
//           bus.off(messageHandler)
//         })
//         .catch((err: unknown) => {
//           if (err instanceof CanceledError) {
//             console.log("[request canceled]", err)
//             bus.emit({
//               reqId,
//               message: {
//                 status: HttpStatusCode.Ok,
//                 msg: "canceled",
//                 content: "",
//                 reasoningContent: "",
//                 role: Role.Assistant,
//               },
//             })
//           } else if (err instanceof AxiosError) {
//             console.log("[request error]", err)
//             bus.emit({
//               reqId,
//               message: {
//                 status: err.status ?? HttpStatusCode.InternalServerError,
//                 msg: err.message,
//                 content: dataToText(err.response?.data),
//                 role: Role.Assistant,
//               },
//             })
//           } else {
//             console.log("[request unknown error]", err)
//             bus.emit({
//               reqId,
//               message: {
//                 status: HttpStatusCode.InternalServerError,
//                 msg: "unknown error",
//                 content: "",
//                 reasoningContent: "",
//                 role: Role.Assistant,
//               },
//             })
//           }
//           bus.off(messageHandler)
//         })
//     }
//     function restart() {
//       abortController.abort()
//       abortController = new AbortController()
//       bus.on(messageHandler)
//       doRequest(abortController.signal, provider)
//     }
//     function terminate() {
//       abortController.abort()
//     }

//     doRequest(abortController.signal, provider)
//     return {
//       restart,
//       terminate,
//     } as LLMChatResponseHandler
//   }
//   return {
//     chat,
//   }
// }
