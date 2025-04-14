import {
  LLMChatRequestHandler,
  LLMChatResponseHandler,
  ProviderMeta,
  LLMChatResponse,
  LLMProvider,
  LLMBaseRequest,
} from "@renderer/types"
import { useEventBus, EventBusKey } from "@vueuse/core"
import { AxiosError, AxiosInstance, CanceledError, HttpStatusCode } from "axios"
export const useLLMChat = (
  instance: AxiosInstance,
  provider: LLMProvider,
  providerMeta: ProviderMeta
): LLMChatRequestHandler => {
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
    const doRequest = (signal: AbortSignal, provider: LLMProvider) => {
      bus.emit({
        reqId,
        message: { status: HttpStatusCode.Continue, msg: "", data: [] },
      })
      const { url, method } = providerMeta.apiLLMChat
      let prevLen = 0 // 已接收到的字符长度
      instance
        .request({
          url: url,
          method: method,
          signal: signal,
          data: cacheMessage,
          onDownloadProgress: event => {
            const status = event.event?.target?.status
            if (status == HttpStatusCode.Ok) {
              const currentText: string = event.event?.target?.responseText ?? ""
              const newText = currentText.slice(prevLen)
              prevLen = currentText.length
              const res = provider.parseResponse(newText)
              bus.emit({ reqId, message: res })
            } else {
              bus.emit({ reqId, message: { status, msg: "", data: [] } })
            }
          },
        })
        .then(() => {
          console.log("[request finish]")
          bus.emit({ reqId, message: { status: HttpStatusCode.Ok, msg: "finish", data: [] } })
          bus.off(messageHandler)
        })
        .catch((err: unknown) => {
          if (err instanceof CanceledError) {
            console.log("[request canceled]", err)
            bus.emit({
              reqId,
              message: {
                status: HttpStatusCode.Ok,
                msg: "canceled",
                data: [],
              },
            })
          } else if (err instanceof AxiosError) {
            console.log("[request error]", err)
            bus.emit({
              reqId,
              message: {
                status: err.status ?? HttpStatusCode.InternalServerError,
                msg: err.message,
                data: [{ content: dataToText(err.response?.data), role: "assistant" }],
              },
            })
          } else {
            console.log("[request unknown error]", err)
            bus.emit({
              reqId,
              message: {
                status: HttpStatusCode.InternalServerError,
                msg: "unknown error",
                data: [],
              },
            })
          }
          bus.off(messageHandler)
        })
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
