import {
  DSChatCompletionRequest,
  DSChatCompletionResponseStream,
  LLMChatMessage,
  LLMBaseRequest,
  LLMChatResponse,
  LLMChatResponseHandler,
  LLMProvider,
  ProviderMeta,
  ModelMeta,
  DSMessage,
  ModelType,
  DSModelsResponse,
} from "@renderer/types"
import JSON5 from "json5"
import { useLLMChat, createInstance } from "@renderer/lib/http"
import { AxiosInstance, HttpStatusCode } from "axios"

export class LLMDeepSeek implements LLMProvider {
  #messageConfig: DSChatCompletionRequest
  #axios?: AxiosInstance
  constructor() {
    this.#messageConfig = {
      messages: [],
      model: "deepseek-chat",
      frequency_penalty: 0,
      max_tokens: 4096,
      presence_penalty: 0,
      response_format: {
        type: "text",
      },
      stream: true,
      temperature: 0.7,
      // tool_choice: "none",
    }
  }
  parseResponse(text: string): LLMChatResponse {
    const data: DSChatCompletionResponseStream[] = text
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
      this.#messageConfig = reqConfig as DSChatCompletionRequest
    }
    const msg = (Array.isArray(message) ? message : [message]) as DSMessage[]
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
    try {
      if (!this.#axios) {
        this.#axios = createInstance()
      }
      this.#axios.defaults.baseURL = provider.apiUrl
      this.#axios.defaults.headers.common["Authorization"] = `Bearer ${provider.apiKey}`
      const res = await this.#axios.request<DSModelsResponse>({
        method: provider.apiModelList.method,
        url: provider.apiModelList.url,
      })
      return res.data.data.map<ModelMeta>((v: DSModelsResponse["data"][number]) => ({
        id: `${provider.name}_${v.id}`,
        type: v.id === "deepseek-chat" ? ModelType.Chat : ModelType.ChatReasoner,
        modelName: v.id,
        providerName: provider.name,
      }))
    } catch (error) {
      console.log(`[error fetchModels] provider: ${provider.name}`, error)
      return []
    }
  }
}
