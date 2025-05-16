import {
  LLMChatMessage,
  LLMChatResponse,
  LLMProvider,
  ProviderMeta,
  ModelMeta,
  LLMBaseRequest,
  LLMChatRequestHandler,
} from "@renderer/types"
// import OpenAi from "openai"

export class OpenAI implements LLMProvider {
  constructor() {}
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

  async titleSummary(
    _context: string,
    _modelMeta: ModelMeta,
    _provider: ProviderMeta,
    _reqConfig?: LLMBaseRequest
  ): Promise<string> {
    return ""
  }
}
