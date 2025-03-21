import {
  DsChatCompletionRequest,
  DsChatCompletionResponseStreamBase,
  LLMChatMessage,
  LLMChatRequestHandler,
  LLMChatResponse,
  LLMChatResponseHandler,
  LLMProvider,
  ProviderConfig,
} from "@renderer/types"
import { merge } from "lodash"
import JSON5 from "json5"
import { useLLMChat } from "@renderer/lib/http"

export class LLMDeepSeek implements LLMProvider {
  #providerConfig: ProviderConfig
  #messageConfig: DsChatCompletionRequest
  #http: LLMChatRequestHandler
  constructor(providerConfig: ProviderConfig) {
    this.#providerConfig = providerConfig
    this.#messageConfig = {
      messages: [],
      model: "deepseek-chat",
      frequency_penalty: 0,
      max_tokens: 4096,
      presence_penalty: 0,
      response_format: {
        type: "text",
      },
      stream: true,
      temperature: 0.7,
      logprobs: false,
      top_logprobs: 0,
      tool_choice: "none",
    }
    this.#http = useLLMChat(this)
    // this.#messageConfig.messages.push({
    //   role: "system",
    //   content: "你是一个AI助手,请根据用户的问题给出回答。",
    // })
  }
  getConfig(): ProviderConfig {
    return this.#providerConfig
  }
  isReasoning(): boolean {
    return this.#messageConfig.model === "deepseek-reasoner"
  }
  setMessageConfig(config: DsChatCompletionRequest): void {
    this.#messageConfig = config
  }
  updateMessageConfig(config: DsChatCompletionRequest): void {
    this.#messageConfig = merge(this.#messageConfig, config)
  }
  getMessageConfig(): DsChatCompletionRequest {
    return this.#messageConfig
  }
  parseResponse(text: string): LLMChatResponse {
    const data: DsChatCompletionResponseStreamBase[] = text
      .replace(/data: |\[DONE\]|: keep-alive/g, "")
      .split("\n")
      .filter(item => !!item)
      .map(item => JSON5.parse(item))
    return {
      status: 206,
      msg: "",
      data: data.map<LLMChatMessage>(v => ({
        role: "assistant",
        content: v.choices[0].delta.content || "",
        reasoningContent: v.choices[0].delta.reasoning_content || "",
      })),
    }
  }
  getRequestBody(message: LLMChatMessage | LLMChatMessage[]): Record<string, unknown> {
    //TODO: deep clone
    this.#messageConfig.messages = Array.isArray(message) ? message : [message]
    return this.#messageConfig
  }
  getModels(): string[] {
    return this.#providerConfig.modelIds
  }
  setModel(modelId: string): void {
    if (!this.#providerConfig.modelIds.includes(modelId)) {
      this.#providerConfig.modelIds.push(modelId)
    }
  }
  chat(
    message: LLMChatMessage | LLMChatMessage[],
    callback: (message: LLMChatResponse) => void
  ): LLMChatResponseHandler {
    return this.#http.chat(message, callback)
  }
}
