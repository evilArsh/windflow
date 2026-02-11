import {
  ProviderMeta,
  ModelMeta,
  RequestHandler,
  MediaRequest,
  Message,
  LLMResponse,
  Provider,
  BeforeRequestCallback,
  LLMConfig,
  Role,
  ImageResponse,
} from "@windflow/core/types"
import { generateSummaryText } from "../compatible/utils"
import { makeRequest, useSingleLLMChat } from "../compatible/request"
import { volcengineLLMParamsHandler, useHandler } from "./utils"

export class Volcengine implements Provider {
  name(): string {
    return "volcengine"
  }
  async fetchModels(_provider: ProviderMeta): Promise<ModelMeta[]> {
    return []
  }
  async chat(
    messages: Message[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    callback: (message: LLMResponse) => void,
    beforeRequest?: BeforeRequestCallback
  ): Promise<RequestHandler> {
    const requestHandler = useSingleLLMChat()
    makeRequest(messages, providerMeta, modelMeta, requestHandler, callback, volcengineLLMParamsHandler, beforeRequest)
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
      const requestData = volcengineLLMParamsHandler(
        [{ role: Role.User, content: generateSummaryText(context) }],
        modelMeta,
        [],
        reqConfig
      )
      // force no thinking
      // FIXME: not test yet
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
  async textToImage(
    _message: MediaRequest,
    _model: ModelMeta,
    _provider: ProviderMeta,
    _callback: (message: ImageResponse) => void
  ): Promise<RequestHandler> {
    return useHandler()
  }
}
