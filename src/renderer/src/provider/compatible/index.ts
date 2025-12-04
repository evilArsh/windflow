import {
  Message,
  LLMResponse,
  ProviderMeta,
  ModelMeta,
  LLMConfig,
  Role,
  RequestHandler,
  Provider,
  ImageResponse,
  MediaRequest,
  BeforeRequestCallback,
} from "@renderer/types"
import { createInstance } from "../http"
import { useSingleLLMChat, makeRequest } from "./request"
import { mergeRequestConfig, generateSummaryText } from "./utils"

export abstract class Compatible implements Provider {
  axios = createInstance()
  constructor() {}
  abstract fetchModels(provider: ProviderMeta): Promise<ModelMeta[]>
  abstract name(): string
  abstract textToImage(
    message: MediaRequest,
    model: ModelMeta,
    provider: ProviderMeta,
    callback: (message: ImageResponse) => void
  ): Promise<RequestHandler>

  async chat(
    messages: Message[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    callback: (message: LLMResponse) => void,
    beforeRequest?: BeforeRequestCallback
  ): Promise<RequestHandler> {
    const requestHandler = useSingleLLMChat()
    makeRequest(messages, providerMeta, modelMeta, requestHandler, callback, beforeRequest)
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
