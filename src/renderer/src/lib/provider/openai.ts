import {
  LLMChatMessage,
  LLMChatResponse,
  Provider,
  ProviderMeta,
  ModelMeta,
  LLMBaseRequest,
  LLMChatRequestHandler,
  TextToImageRequest,
} from "@renderer/types"
import { BridgeResponse } from "@shared/types/bridge"
// import OpenAi from "openai"

export class OpenAI implements Provider {
  constructor() {}

  name(): string {
    return "openai"
  }
  async fetchModels(_provider: ProviderMeta): Promise<ModelMeta[]> {
    return []
  }
  async chat(
    _messages: LLMChatMessage[],
    _modelMeta: ModelMeta,
    _providerMeta: ProviderMeta,
    _mcpServersIds: string[],
    _callback: (message: LLMChatResponse) => void,
    _reqConfig?: LLMBaseRequest
  ): Promise<LLMChatRequestHandler> {
    throw new Error("Method not implemented.")
  }

  async summarize(
    _context: string,
    _modelMeta: ModelMeta,
    _provider: ProviderMeta,
    _reqConfig?: LLMBaseRequest
  ): Promise<string> {
    return ""
  }
  textToImage(
    _text: string,
    _model: ModelMeta,
    _provider: ProviderMeta,
    _reqConfig?: TextToImageRequest
  ): Promise<BridgeResponse<string>> {
    throw new Error("Method not implemented.")
  }
}
