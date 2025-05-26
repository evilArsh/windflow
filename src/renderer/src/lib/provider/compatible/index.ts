import {
  LLMMessage,
  LLMResponse,
  ProviderMeta,
  ModelMeta,
  LLMRequest,
  Role,
  LLMRequestHandler,
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
  ): Promise<LLMRequestHandler> {
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
    reqConfig?: LLMRequest
  ): Promise<string> {
    const requestData = mergeRequestConfig(
      [{ role: Role.User, content: generateSummaryText(context) }],
      modelMeta,
      reqConfig
    )
    requestData.stream = false
    const requestHandler = useSingleLLMChat()
    for await (const content of requestHandler.chat(requestData, provider)) {
      const { data } = content
      if (isString(data.content)) {
        return data.content
      }
    }
    return ""
  }
}
