import { DsChatCompletionRequest, ProviderName, ChatRequestHandler, ChatResponseHandler } from "@renderer/types"
import { Provider } from "@renderer/types"
import { useEventBus } from "@vueuse/core"
import axios, { AxiosInstance } from "axios"
import JSON5 from "json5"

export const useLLMChat = (provider: Provider): ChatRequestHandler => {
  const instance = shallowRef<AxiosInstance>(createInstance(provider))
  const reqMap = new Map<string, ChatResponseHandler>()

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
        model: "deepseek-reasoner",
        logprobs: false,
      }
      return body
    }
    return ""
  }
  const parseResponseText = (text: string) => {
    if (provider.name === ProviderName.DeepSeek) {
      return text
        .split("\n")
        .filter(item => !!item)
        .map(item => JSON5.parse(item.replace("data: ", "")))
    }
    return []
  }

  function request(message: string): ChatResponseHandler {
    const id = uniqueId()
    const abortController = new AbortController()
    instance.value.request({
      url: provider.apiLLMChat.url,
      method: provider.apiLLMChat.method,
      signal: abortController.signal,
      responseType: "text",
      data: messageBody(message),
      onDownloadProgress: progressEvent => {
        const res = parseResponseText(progressEvent.event.currentTarget.responseText)
        res.forEach(item => {
          console.log(item.choices[0].delta.reasoning_content ?? item.choices[0].delta.content)
        })
      },
    })
    const event = useEventBus<string>("message")
    let callback: (message: string) => void = () => {}
    const handler: ChatResponseHandler = {
      restart: () => {},
      terminate: () => {
        abortController.abort()
        reqMap.delete(id)
      },
      onData: (cb: (message: string) => void) => {
        callback = cb
      },
    }
    reqMap.set(id, handler)
    event.on(data => {
      callback(data)
    })
    return handler
  }
  return {
    request,
  }
}
