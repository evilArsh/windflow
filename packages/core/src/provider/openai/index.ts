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
  Role,
} from "@windflow/core/types"
import OpenAISDK from "openai"
import { makeRequest, useHandler } from "./request"
import { generateSummaryText } from "../compatible/utils"
import { toNumber } from "@toolmain/shared"

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
    context: string,
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    callback: (message: LLMResponse) => void,
    _reqConfig?: LLMConfig
  ): Promise<RequestHandler> {
    const client = this.#getClient(providerMeta)
    const requestHandler = useHandler()
    const request = async () => {
      const response = await client.responses.create(
        {
          stream: false,
          model: modelMeta.modelName,
          input: generateSummaryText(context),
          temperature: 0,
        },
        {
          signal: requestHandler.getSignal(),
          path: providerMeta.api.llmChat?.url,
          method: providerMeta.api.llmChat?.method as any,
        }
      )
      const res = response.output
        .filter(o => o.type === "message")
        .map(m => m.content.map(item => (item.type === "output_text" ? item.text : "")))
        .join("")
      callback({
        status: 200,
        data: {
          content: res,
          role: Role.Assistant,
          usage: {
            total_tokens: toNumber(response.usage?.total_tokens),
            prompt_tokens: toNumber(response.usage?.input_tokens),
            completion_tokens: toNumber(response.usage?.output_tokens),
          },
        },
      })
    }
    request()
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
