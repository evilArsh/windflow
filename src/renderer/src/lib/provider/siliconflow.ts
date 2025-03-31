import {
  SFChatCompletionRequest,
  SFChatCompletionResponse,
  LLMChatMessage,
  LLMBaseRequest,
  LLMChatResponse,
  LLMChatResponseHandler,
  LLMProvider,
  ProviderMeta,
  ModelMeta,
  SFMessage,
  ModelType,
  SFModelsResponse,
} from "@renderer/types"
import JSON5 from "json5"
import { useLLMChat, createInstance } from "@renderer/lib/http"
import { AxiosInstance, HttpStatusCode } from "axios"

const types = [
  { name: "chat", type: ModelType.Chat },
  { name: "embedding", type: ModelType.Embedding },
  { name: "reranker", type: ModelType.Reranker },
  { name: "text-to-image", type: ModelType.TextToImage },
  { name: "image-to-image", type: ModelType.ImageToImage },
  { name: "speech-to-text", type: ModelType.SpeechToText },
  { name: "text-to-video", type: ModelType.TextToVideo },
]
const reasonerPattern = /deepseek-r1|qwq-32b/

export class SiliconFlow implements LLMProvider {
  #messageConfig: SFChatCompletionRequest
  #axios?: AxiosInstance
  constructor() {
    this.#messageConfig = {
      model: "",
      messages: [],
      stream: true,
      max_tokens: 16384,
      temperature: 0.7,
      // top_p: 0.7,
      top_k: 50,
      frequency_penalty: 0.5,
      n: 1,
      response_format: {
        type: "text",
      },
    }
  }
  parseResponse(text: string): LLMChatResponse {
    const data: SFChatCompletionResponse[] = text
      .replace(/data: |\[DONE\]|: keep-alive/g, "")
      .split("\n")
      .filter(item => !!item)
      .map(item => JSON5.parse(item))
    return {
      status: HttpStatusCode.PartialContent,
      msg: "",
      data: data.map<LLMChatMessage>(v => ({
        role: "assistant",
        content: v.choices[0].delta.content ?? "",
        reasoningContent: v.choices[0].delta.reasoning_content ?? "",
      })),
    }
  }

  chat(
    message: LLMChatMessage | LLMChatMessage[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    callback: (message: LLMChatResponse) => void,
    reqConfig?: LLMBaseRequest
  ): LLMChatResponseHandler {
    if (!this.#axios) {
      this.#axios = createInstance()
    }
    this.#axios.defaults.baseURL = providerMeta.apiUrl
    this.#axios.defaults.headers.common["Authorization"] = `Bearer ${providerMeta.apiKey}`

    const request = useLLMChat(this.#axios, this, providerMeta)
    if (reqConfig) {
      this.#messageConfig = reqConfig as SFChatCompletionRequest
    }
    const msg = (Array.isArray(message) ? message : [message]) as SFMessage[]
    this.#messageConfig.messages = this.#messageConfig.messages.concat(msg)

    this.#messageConfig.model = modelMeta.modelName
    return request.chat(this.#messageConfig, cb => {
      callback({
        ...cb,
        reasoning: modelMeta.type === ModelType.ChatReasoner,
      })
    })
  }

  async fetchModels(provider: ProviderMeta): Promise<ModelMeta[]> {
    if (!this.#axios) {
      this.#axios = createInstance()
    }
    const res: ModelMeta[][] = []
    this.#axios.defaults.baseURL = provider.apiUrl
    this.#axios.defaults.headers.common["Authorization"] = `Bearer ${provider.apiKey}`
    const req = types.reduce(
      (acc, v) => {
        if (this.#axios) {
          acc.push(
            this.#axios
              .request<SFModelsResponse>({
                method: provider.apiModelList.method,
                url: provider.apiModelList.url,
                params: { sub_type: v.name },
              })
              .then(res => ({
                type: v.type,
                data: res.data.data,
              }))
          )
        }
        return acc
      },
      [] as Promise<{ type: ModelType; data: SFModelsResponse["data"] }>[]
    )
    const dataRes = await Promise.all(req)

    dataRes.forEach(items => {
      res.push(
        items.data.map(v => ({
          id: `${provider.name}_${v.id}`,
          type:
            items.type === ModelType.Chat
              ? reasonerPattern.test(v.id.toLowerCase())
                ? ModelType.ChatReasoner
                : ModelType.Chat
              : items.type,
          modelName: v.id,
          providerName: provider.name,
          subProviderName: v.id.indexOf("/") > 0 ? v.id.slice(0, v.id.indexOf("/")) : provider.name,
        }))
      )
    })
    return res.flat()
  }
}
