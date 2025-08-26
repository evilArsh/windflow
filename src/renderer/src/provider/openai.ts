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
} from "@renderer/types"
import { useSingleLLMChat } from "./compatible/request"
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
    _messages: Message[],
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
