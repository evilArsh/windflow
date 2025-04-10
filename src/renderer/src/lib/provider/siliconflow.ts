import {
  LLMChatMessage,
  LLMBaseRequest,
  LLMChatResponse,
  LLMChatResponseHandler,
  LLMProvider,
  ProviderMeta,
  ModelMeta,
  ModelType,
  ChatCompletionRequest,
  Message,
  ModelsResponse,
} from "@renderer/types"
import { useLLMChat, createInstance } from "@renderer/lib/http"
import { AxiosInstance } from "axios"
import { parseOpenAIResponseStream } from "./utils/chat"

const types = [
  { name: "chat", type: ModelType.Chat },
  { name: "embedding", type: ModelType.Embedding },
  { name: "reranker", type: ModelType.Reranker },
  { name: "text-to-image", type: ModelType.TextToImage },
  { name: "image-to-image", type: ModelType.ImageToImage },
  { name: "speech-to-text", type: ModelType.SpeechToText },
  { name: "text-to-video", type: ModelType.TextToVideo },
]
const reasonerPattern = /deepseek-r1|qwq-32b|deepseek-reasoner/

export class SiliconFlow implements LLMProvider {
  #messageConfig: ChatCompletionRequest
  #axios: AxiosInstance
  constructor() {
    this.#messageConfig = {
      model: "",
      messages: [],
      stream: true,
      max_tokens: 8192,
      n: 1,
      response_format: {
        type: "text",
      },
    }
    this.#axios = createInstance()
  }
  parseResponse(text: string): LLMChatResponse {
    return parseOpenAIResponseStream(text)
  }

  chat(
    message: LLMChatMessage | LLMChatMessage[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    callback: (message: LLMChatResponse) => void,
    reqConfig?: LLMBaseRequest
  ): LLMChatResponseHandler {
    this.#axios.defaults.baseURL = providerMeta.apiUrl
    this.#axios.defaults.headers.common["Authorization"] = `Bearer ${providerMeta.apiKey}`

    const request = useLLMChat(this.#axios, this, providerMeta)
    if (reqConfig) {
      this.#messageConfig = reqConfig as ChatCompletionRequest
    }
    this.#messageConfig.messages = (Array.isArray(message) ? message : [message]) as Message[]

    this.#messageConfig.model = modelMeta.modelName
    const mn = modelMeta.modelName.toLowerCase()
    if (mn.includes("deepseek")) {
      this.#messageConfig.max_tokens = 8192
    } else {
      this.#messageConfig.max_tokens = 4096
    }
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
        acc.push(
          this.#axios
            .request<ModelsResponse>({
              method: provider.apiModelList.method,
              url: provider.apiModelList.url,
              params: { sub_type: v.name },
            })
            .then(res => ({
              type: v.type,
              data: res.data.data,
            }))
        )
        return acc
      },
      [] as Promise<{ type: ModelType; data: ModelsResponse["data"] }>[]
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
