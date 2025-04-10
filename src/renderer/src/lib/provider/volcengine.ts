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
  ProviderName,
} from "@renderer/types"
import { useLLMChat, createInstance } from "@renderer/lib/http"
import { AxiosInstance } from "axios"
import { parseOpenAIResponseStream } from "./utils/chat"
import { modelsDefault } from "@renderer/store/default/models.default"

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

  async fetchModels(_provider: ProviderMeta): Promise<ModelMeta[]> {
    return modelsDefault().filter(v => v.providerName === ProviderName.Volcengine)
  }
}
