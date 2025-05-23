import {
  LLMChatMessage,
  LLMChatResponse,
  ProviderMeta,
  ModelMeta,
  LLMBaseRequest,
  Role,
  LLMChatRequestHandler,
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
    messages: LLMChatMessage[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    mcpServersIds: string[],
    callback: (message: LLMChatResponse) => void,
    reqConfig?: LLMBaseRequest
  ): Promise<LLMChatRequestHandler> {
    const requestHandler = useSingleLLMChat()
    makeRequest(messages, providerMeta, modelMeta, requestHandler, mcpServersIds, callback, reqConfig)
    return requestHandler
  }
  /**
   * @description `LLMProvider` implementation
   */
  async titleSummary(
    context: string,
    modelMeta: ModelMeta,
    provider: ProviderMeta,
    reqConfig?: LLMBaseRequest
  ): Promise<string> {
    const requestData = mergeRequestConfig(
      [{ role: Role.User, content: generateSummaryText(context) }],
      modelMeta,
      reqConfig
    )
    requestData.stream = false
    const requestHandler = useSingleLLMChat()
    for await (const content of requestHandler.chat(requestData, provider)) {
      if (isString(content.content)) {
        return content.content
      }
    }
    return ""
  }
}
