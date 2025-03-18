import {
  DsChatCompletionRequest,
  ProviderName,
  LLMChatRequestHandler,
  LLMChatResponseHandler,
  DsChatCompletionResponseStreamBase,
  Provider,
  LLMChatResponse,
} from "@renderer/types"
import useProviderStore from "@renderer/pinia/provider.store"
import { useEventBus, EventBusKey } from "@vueuse/core"
import axios, { AxiosInstance, Method } from "axios"
import JSON5 from "json5"

export const useLLMChat = (providerId: string): LLMChatRequestHandler => {
  const providerStore = useProviderStore()
  const provider = providerStore.findById(providerId)
  if (!provider) {
    throw new Error("Provider not found")
  }
  const instance = shallowRef<AxiosInstance>(createInstance(provider))
  const eventBusKey: EventBusKey<{ reqId: string; message: LLMChatResponse }> = Symbol("message")
  const eventBus = useEventBus(eventBusKey)

  function createInstance(provider: Provider) {
    return axios.create({
      baseURL: provider.apiUrl,
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
      },
    })
  }
  const messageBody = (message: string) => {
    if (provider.name === ProviderName.DeepSeek) {
      const body: DsChatCompletionRequest = {
        messages: [{ role: "user", content: message }],
        stream: true,
        stream_options: {
          include_usage: true,
        },
        model: "deepseek-chat",
        logprobs: false,
      }
      return body
    }
    return ""
  }
  const parseResponseText = (text: string): LLMChatResponse => {
    if (provider.name === ProviderName.DeepSeek) {
      const data: DsChatCompletionResponseStreamBase[] = text
        .replace(/data: |\[DONE\]|: keep-alive/g, "")
        .split("\n")
        .filter(item => !!item)
        .map(item => JSON5.parse(item))
      return {
        status: 200,
        msg: "",
        data: data.map(v => ({
          reasoning: v.object === "chat.completion.chunk",
          content: v.choices[0].delta.content ?? "",
          reasoningContent: v.choices[0].delta.reasoning_content ?? "",
        })),
      }
    }
    return {
      status: 200,
      msg: "",
      data: [],
    }
  }

  function request(message: string, callback: (message: LLMChatResponse) => void): LLMChatResponseHandler {
    const reqId = uniqueId()
    let abortController = new AbortController()
    const messageHandler = (event: { reqId: string; message: LLMChatResponse }) => {
      if (event.reqId === reqId) {
        callback(event.message)
      }
    }
    const doRequest = (signal: AbortSignal, url: string, method: Method | string) => {
      let prevLen = 0 // 已接收到的字符长度
      instance.value
        .request({
          url: url,
          method: method,
          signal: signal,
          data: messageBody(message),
          onDownloadProgress: event => {
            const status = event.event?.target?.status
            if (status == 200) {
              const currentText: string = event.event?.target?.responseText ?? ""
              const newText = currentText.slice(prevLen)
              prevLen = currentText.length
              const res = parseResponseText(newText)
              eventBus.emit({
                reqId,
                message: res,
              })
            } else {
              eventBus.emit({
                reqId,
                message: { status, msg: "", data: [] },
              })
            }
          },
        })
        .then(() => {
          eventBus.emit({ reqId, message: { status: 200, msg: "finish", data: [] } })
          eventBus.off(messageHandler)
        })
        .catch(err => {
          eventBus.emit({ reqId, message: { status: 500, msg: err.toString(), data: [] } })
          eventBus.off(messageHandler)
        })
    }
    eventBus.on(messageHandler)
    const provider = providerStore.findById(providerId)
    if (provider) {
      doRequest(abortController.signal, provider.apiLLMChat.url, provider.apiLLMChat.method)
    } else {
      console.warn("[request] cannot find provider ", providerId)
    }
    function restart() {
      abortController.abort()
      abortController = new AbortController()
      const provider = providerStore.findById(providerId)
      if (provider) {
        doRequest(abortController.signal, provider.apiLLMChat.url, provider.apiLLMChat.method)
      } else {
        console.warn("[restart] cannot find provider ", providerId)
      }
    }
    function terminate() {
      abortController.abort()
      eventBus.off(messageHandler)
    }
    const handler: LLMChatResponseHandler = {
      restart,
      terminate,
    }
    return handler
  }
  return {
    request,
  }
}
