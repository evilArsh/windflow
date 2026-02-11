import {
  ProviderMeta,
  ModelMeta,
  ModelType,
  ModelsResponse,
  RequestHandler,
  MediaRequest,
  Message,
  LLMResponse,
  Provider,
  BeforeRequestCallback,
  LLMConfig,
  Role,
} from "@windflow/core/types"
import { generateSummaryText, patchAxios } from "../compatible/utils"
import { makeRequest, useSingleLLMChat } from "../compatible/request"
import { deepSeekLLMParamsHandler, useHandler } from "./utils"
import { createInstance } from "../utils"

export class DeepSeek implements Provider {
  #axios = createInstance()
  name(): string {
    return "deepseek"
  }
  async fetchModels(provider: ProviderMeta): Promise<ModelMeta[]> {
    patchAxios(provider, this.#axios)
    const res = await this.#axios.request<ModelsResponse>({
      method: provider.api.models?.method,
      url: provider.api.models?.url,
    })
    return res.data.data.map<ModelMeta>((v: ModelsResponse["data"][number]) => ({
      id: `${provider.name}_${v.id}`,
      type: [ModelType.Chat],
      modelName: v.id,
      providerName: provider.name,
      subProviderName: provider.name,
    }))
  }
  async chat(
    messages: Message[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    callback: (message: LLMResponse) => void,
    beforeRequest?: BeforeRequestCallback
  ): Promise<RequestHandler> {
    const requestHandler = useSingleLLMChat()
    makeRequest(messages, providerMeta, modelMeta, requestHandler, callback, deepSeekLLMParamsHandler, beforeRequest)
    return requestHandler
  }
  async summarize(
    context: string,
    modelMeta: ModelMeta,
    provider: ProviderMeta,
    callback: (message: LLMResponse) => void,
    reqConfig?: LLMConfig
  ): Promise<RequestHandler> {
    const requestHandler = useSingleLLMChat()
    const request = async () => {
      const requestData = deepSeekLLMParamsHandler(
        [{ role: Role.User, content: generateSummaryText(context) }],
        modelMeta,
        [],
        reqConfig
      )
      // force no thinking
      requestData.thinking = {
        type: "disabled",
      }
      requestData.stream = false
      for await (const content of requestHandler.chat(requestData, provider)) {
        callback(content)
      }
    }
    request()
    return requestHandler
  }
  /**
   * DeepSeek current not used
   */
  async textToImage(_message: MediaRequest, _modelMeta: ModelMeta, _provider: ProviderMeta): Promise<RequestHandler> {
    return useHandler()
  }
}
