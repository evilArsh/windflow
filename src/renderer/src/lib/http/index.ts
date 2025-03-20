import {
  LLMChatRequestHandler,
  LLMChatResponseHandler,
  ProviderConfig,
  LLMChatResponse,
  LLMChatMessage,
  LLMProvider,
} from "@renderer/types"
import { useEventBus, EventBusKey } from "@vueuse/core"
import axios from "axios"

export const useLLMChat = (provider: LLMProvider): LLMChatRequestHandler => {
  const instance = createInstance(provider.getConfig())
  const eventBusKey: EventBusKey<{ reqId: string; message: LLMChatResponse }> = Symbol(
    `message-${provider.getConfig().id}`
  )
  let cacheMessage: LLMChatMessage | LLMChatMessage[]
  const bus = useEventBus(eventBusKey)

  function createInstance(providerConfig: ProviderConfig) {
    return axios.create({
      baseURL: providerConfig.apiUrl,
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
      },
    })
  }
  function request(
    message: LLMChatMessage | LLMChatMessage[],
    callback: (message: LLMChatResponse) => void
  ): LLMChatResponseHandler {
    cacheMessage = message //TODO: deep clone
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
        message: { reasoning: provider.isReasoning(), status: 100, msg: "", data: [] },
      })
      const { url, method } = provider.getConfig().apiLLMChat
      let prevLen = 0 // 已接收到的字符长度
      instance
        .request({
          url: url,
          method: method,
          signal: signal,
          data: provider.getRequestBody(cacheMessage),
          onDownloadProgress: event => {
            const status = event.event?.target?.status
            if (status == 200) {
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
                message: { reasoning: provider.isReasoning(), status, msg: "", data: [] },
              })
            }
          },
        })
        .then(() => {
          bus.emit({ reqId, message: { reasoning: provider.isReasoning(), status: 200, msg: "finish", data: [] } })
          bus.off(messageHandler)
        })
        .catch(err => {
          bus.emit({
            reqId,
            message: { reasoning: provider.isReasoning(), status: 500, msg: err.toString(), data: [] },
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
    request,
  }
}
