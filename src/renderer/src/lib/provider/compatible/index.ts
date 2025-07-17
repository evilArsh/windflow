import {
  LLMMessage,
  LLMResponse,
  ProviderMeta,
  ModelMeta,
  LLMRequest,
  Role,
  RequestHandler,
  Provider,
} from "@renderer/types"
import { createInstance } from "../http"
import { useSingleLLMChat, makeRequest } from "./request"
import { mergeRequestConfig, generateSummaryText } from "./utils"
import { BridgeResponse } from "@shared/types/bridge"

export abstract class Compatible implements Provider {
  axios = createInstance()
  constructor() {}
  abstract fetchModels(provider: ProviderMeta): Promise<ModelMeta[]>
  abstract name(): string
  abstract textToImage(text: string, modelMeta: ModelMeta, provider: ProviderMeta): Promise<BridgeResponse<string>>
  /**
   * @description `LLMProvider` implementation
   */
  async chat(
    messages: LLMMessage[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    mcpServersIds: string[],
    callback: (message: LLMResponse) => void,
    reqConfig?: LLMRequest
  ): Promise<RequestHandler> {
    const requestHandler = useSingleLLMChat()
    makeRequest(messages, providerMeta, modelMeta, requestHandler, mcpServersIds, callback, reqConfig)
    return requestHandler
  }
  /**
   * @description `LLMProvider` implementation
   */
  async summarize(
    context: string,
    modelMeta: ModelMeta,
    provider: ProviderMeta,
    callback: (message: LLMResponse) => void,
    reqConfig?: LLMRequest
  ): Promise<RequestHandler> {
    const requestHandler = useSingleLLMChat()
    const request = async () => {
      const requestData = mergeRequestConfig(
        [{ role: Role.User, content: generateSummaryText(context) }],
        modelMeta,
        reqConfig
      )
      requestData.stream = false
      for await (const content of requestHandler.chat(requestData, provider)) {
        callback(content)
      }
    }
    request()
    return requestHandler
  }
}
