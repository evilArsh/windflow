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
  ChatCompletionResponseStream,
} from "@renderer/types"
import { useLLMChat, createInstance } from "@renderer/lib/http"
import { AxiosInstance, HttpStatusCode } from "axios"
import JSON5 from "json5"
import { cloneDeep } from "lodash"

export abstract class OpenAICompatible implements LLMProvider {
  #axios: AxiosInstance
  #messageConfig: ChatCompletionRequest
  constructor() {
    this.#axios = createInstance()
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
  }
  abstract fetchModels(provider: ProviderMeta): Promise<ModelMeta[]>

  getInstance(provider: ProviderMeta): AxiosInstance {
    this.#axios.defaults.baseURL = provider.apiUrl
    this.#axios.defaults.headers.common["Authorization"] = `Bearer ${provider.apiKey}`
    return this.#axios
  }

  parseResponse(text: string): LLMChatResponse {
    try {
      const data: ChatCompletionResponseStream[] = text
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
    } catch (error) {
      return {
        status: HttpStatusCode.PartialContent,
        msg: "",
        data: [{ content: dataToText(error), role: "assistant" }],
      }
    }
  }
  chat(
    message: LLMChatMessage | LLMChatMessage[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    callback: (message: LLMChatResponse) => void,
    reqConfig?: LLMBaseRequest
  ): LLMChatResponseHandler {
    const request = useLLMChat(this.getInstance(providerMeta), this, providerMeta)
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
    return request.chat(cloneDeep(this.#messageConfig), cb => {
      callback({
        ...cb,
        reasoning: modelMeta.type === ModelType.ChatReasoner,
      })
    })
  }
}

export class OpenAI extends OpenAICompatible {
  constructor() {
    super()
  }
  async fetchModels(_provider: ProviderMeta): Promise<ModelMeta[]> {
    return []
  }
}
