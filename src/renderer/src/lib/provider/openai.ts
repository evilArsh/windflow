import {
  LLMMessage,
  LLMResponse,
  Provider,
  ProviderMeta,
  ModelMeta,
  LLMRequest,
  LLMRequestHandler,
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
    _messages: LLMMessage[],
    _modelMeta: ModelMeta,
    _providerMeta: ProviderMeta,
    _mcpServersIds: string[],
    _callback: (message: LLMResponse) => void,
    _reqConfig?: LLMRequest
  ): Promise<LLMRequestHandler> {
    throw new Error("Method not implemented.")
  }

  async summarize(
    _context: string,
    _modelMeta: ModelMeta,
    _provider: ProviderMeta,
    _reqConfig?: LLMRequest
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
