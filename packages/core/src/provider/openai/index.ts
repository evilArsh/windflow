import {
  Message,
  LLMResponse,
  Provider,
  ProviderMeta,
  ModelMeta,
  LLMConfig,
  MediaRequest,
  RequestHandler,
  ImageResponse,
  BeforeRequestCallback,
} from "@windflow/core/types"
import OpenAISDK from "openai"
import { makeRequest, useHandler } from "./request"

export class OpenAI implements Provider {
  #client?: OpenAISDK
  constructor() {}
  name(): string {
    return "openai"
  }
  #getClient(provider: ProviderMeta) {
    if (!this.#client) {
      this.#client = new OpenAISDK({
        apiKey: provider.api.key,
        baseURL: provider.api.url,
        dangerouslyAllowBrowser: true,
      })
    }
    return this.#client
  }
  async fetchModels(provider: ProviderMeta): Promise<ModelMeta[]> {
    const res = await this.#getClient(provider).models.list({
      method: provider.api.models?.method as any,
      path: provider.api.models?.url,
    })
    return res.data.map<ModelMeta>(model => {
      return {
        id: `${provider.name}_${model.id}`,
        type: [],
        modelName: model.id,
        providerName: provider.name,
        subProviderName: model.owned_by,
      }
    })
    // .filter(model => model.subProviderName === "openai")
  }
  async chat(
    messages: Message[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    callback: (message: LLMResponse) => void,
    beforeRequest?: BeforeRequestCallback
  ): Promise<RequestHandler> {
    const client = this.#getClient(providerMeta)
    const requestHandler = useHandler()
    makeRequest(client, messages, providerMeta, modelMeta, requestHandler, callback, beforeRequest)
    return requestHandler
  }
  async summarize(
    _context: string,
    _modelMeta: ModelMeta,
    _provider: ProviderMeta,
    _callback: (message: LLMResponse) => void,
    _reqConfig?: LLMConfig
  ): Promise<RequestHandler> {
    const requestHandler = useHandler()
    return requestHandler
  }
  async textToImage(
    _message: MediaRequest,
    _model: ModelMeta,
    _provider: ProviderMeta,
    _callback: (message: ImageResponse) => void
  ): Promise<RequestHandler> {
    const requestHandler = useHandler()
    return requestHandler
  }
}
