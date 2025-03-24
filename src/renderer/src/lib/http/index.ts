import {
  LLMChatRequestHandler,
  LLMChatResponseHandler,
  ProviderMeta,
  LLMChatResponse,
  LLMProvider,
  LLMBaseRequest,
} from "@renderer/types"
import { useEventBus, EventBusKey } from "@vueuse/core"
import axios, { AxiosError, AxiosInstance, HttpStatusCode } from "axios"

export const createInstance = (): AxiosInstance => {
  const instance = axios.create()
  instance.interceptors.request.use(
    config => {
      return config
    },
    (error: AxiosError) => {
      console.log("[request error]", error)
      return Promise.reject(error)
    }
  )
  instance.interceptors.response.use(
    response => {
      // console.log("[response]", response)
      return response
    },
    (error: AxiosError) => {
      console.log("[response error]", error)
      return Promise.reject(error)
    }
  )
  return instance
}
export const useLLMChat = (
  instance: AxiosInstance,
  provider: LLMProvider,
  providerMeta: ProviderMeta
): LLMChatRequestHandler => {
  const eventBusKey: EventBusKey<{ reqId: string; message: LLMChatResponse }> = Symbol(`message-${providerMeta.name}`)
  let cacheMessage: LLMBaseRequest = {}
  const bus = useEventBus(eventBusKey)

  function chat(message: LLMBaseRequest, callback: (message: LLMChatResponse) => void): LLMChatResponseHandler {
    cacheMessage = message
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
              bus.emit({
                reqId,
                message: res,
              })
            } else {
              bus.emit({
                reqId,
                message: { status, msg: "", data: [] },
              })
            }
          },
        })
        .then(() => {
          bus.emit({ reqId, message: { status: HttpStatusCode.Ok, msg: "finish", data: [] } })
          bus.off(messageHandler)
        })
        .catch((err: AxiosError) => {
          bus.emit({
            reqId,
            message: {
              status: err.status ?? HttpStatusCode.InternalServerError,
              msg: err.message,
              data: [{ content: err.response?.data as string, role: "assistant" }],
            },
          })
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
      bus.off(messageHandler)
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
