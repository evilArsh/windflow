import {
  DsChatCompletionRequest,
  ProviderName,
  LLMChatRequestHandler,
  LLMChatResponseHandler,
  DsChatCompletionResponseStreamBase,
  ProviderConfig,
  LLMChatResponse,
  LLMChatMessage,
} from "@renderer/types"
import useProviderStore from "@renderer/store/provider.store"
import { useEventBus, EventBusKey } from "@vueuse/core"
import axios, { AxiosInstance, Method } from "axios"
import JSON5 from "json5"

// TODO: refactor
const getLLMRequestConfig = (providerConfig: ProviderConfig, message: LLMChatMessage | LLMChatMessage[]) => {
  const config = {
    body: {} as Record<string, any>,
    reasoning: false,
    responseParser: (text: string): LLMChatResponse => {
      return {
        status: 200,
        msg: text,
        data: [{ role: "assistant", content: text }],
      }
    },
  }
  if (providerConfig.name === ProviderName.DeepSeek) {
    config.body = {
      messages: Array.isArray(message) ? message : [message],
      stream: true,
      stream_options: {
        include_usage: true,
      },
      model: "deepseek-chat",
      logprobs: false,
    } as DsChatCompletionRequest
    config.reasoning = config.body.model === "deepseek-reasoner"
    config.responseParser = (text: string): LLMChatResponse => {
      if (providerConfig.name === ProviderName.DeepSeek) {
        const data: DsChatCompletionResponseStreamBase[] = text
          .replace(/data: |\[DONE\]|: keep-alive/g, "")
          .split("\n")
          .filter(item => !!item)
          .map(item => JSON5.parse(item))
        return {
          status: 206,
          msg: "",
          data: data.map<LLMChatMessage>(v => ({
            role: "assistant",
            content: v.choices[0].delta.content || "",
            reasoningContent: v.choices[0].delta.reasoning_content || "",
          })),
        }
      }
      return {
        status: 200,
        msg: "",
        data: [],
      }
    }
  }
  return config
}
export const useLLMChat = (providerId: string): LLMChatRequestHandler => {
  const providerStore = useProviderStore()
  const provider = providerStore.findById(providerId)
  if (!provider) {
    throw new Error("Provider not found")
  }
  const instance = shallowRef<AxiosInstance>(createInstance(provider))
  const eventBusKey: EventBusKey<{ reqId: string; message: LLMChatResponse }> = Symbol("message")
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
    const reqId = uniqueId()
    let abortController = new AbortController()
    const provider = providerStore.findById(providerId)
    const messageHandler = (event: { reqId: string; message: LLMChatResponse }) => {
      if (event.reqId === reqId) {
        callback(event.message)
      }
    }
    const doRequest = (signal: AbortSignal, provider?: ProviderConfig) => {
      if (!provider) {
        console.warn("[request] cannot find provider ", providerId)
        bus.emit({
          reqId,
          message: { reasoning: false, status: 500, msg: "cannot find provider", data: [] },
        })
        bus.off(messageHandler)
        return
      }
      const config = getLLMRequestConfig(provider, message)
      bus.emit({
        reqId,
        message: { reasoning: config.reasoning, status: 100, msg: "", data: [] },
      })
      const url: string = provider.apiLLMChat.url
      const method: Method = provider.apiLLMChat.method
      let prevLen = 0 // 已接收到的字符长度
      instance.value
        .request({
          url: url,
          method: method,
          signal: signal,
          data: config.body,
          onDownloadProgress: event => {
            const status = event.event?.target?.status
            if (status == 200) {
              const currentText: string = event.event?.target?.responseText ?? ""
              const newText = currentText.slice(prevLen)
              prevLen = currentText.length
              const res = config.responseParser(newText)
              bus.emit({
                reqId,
                message: res,
              })
            } else {
              bus.emit({
                reqId,
                message: { reasoning: config.reasoning, status, msg: "", data: [] },
              })
            }
          },
        })
        .then(() => {
          bus.emit({ reqId, message: { reasoning: config.reasoning, status: 200, msg: "finish", data: [] } })
          bus.off(messageHandler)
        })
        .catch(err => {
          bus.emit({ reqId, message: { reasoning: config.reasoning, status: 500, msg: err.toString(), data: [] } })
          bus.off(messageHandler)
        })
    }
    function restart() {
      abortController.abort()
      abortController = new AbortController()
      const provider = providerStore.findById(providerId)
      doRequest(abortController.signal, provider)
    }
    function terminate() {
      abortController.abort()
      bus.off(messageHandler)
    }

    bus.on(messageHandler)
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
