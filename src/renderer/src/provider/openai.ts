import {
  Message,
  LLMResponse,
  Provider,
  ProviderMeta,
  ModelMeta,
  LLMRequest,
  LLMRequestHandler,
  MediaRequest,
  RequestHandler,
  ImageResponse,
  BeforeRequestCallback,
} from "@renderer/types"
import { useSingleLLMChat } from "./compatible/request"
import OpenAISDK from "openai"

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
    _messages: Message[],
    _modelMeta: ModelMeta,
    _providerMeta: ProviderMeta,
    _callback: (message: LLMResponse) => void,
    _beforeRequest?: BeforeRequestCallback
  ): Promise<LLMRequestHandler> {
    throw new Error("Method not implemented.")
  }
  async summarize(
    _context: string,
    _modelMeta: ModelMeta,
    _provider: ProviderMeta,
    _callback: (message: LLMResponse) => void,
    _reqConfig?: LLMRequest
  ): Promise<RequestHandler> {
    return useSingleLLMChat()
  }
  async textToImage(
    _message: MediaRequest,
    _model: ModelMeta,
    _provider: ProviderMeta,
    _callback: (message: ImageResponse) => void
  ): Promise<RequestHandler> {
    return { terminate: () => {} }
  }
}
