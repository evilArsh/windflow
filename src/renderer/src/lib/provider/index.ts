import { LLMProvider, ModelConfig } from "@renderer/types"

export class ProviderManager {
  #llmProviders: Map<string, LLMProvider<unknown>>
  constructor() {
    this.#llmProviders = new Map()
  }
  getProvider(providerId: string): LLMProvider<unknown> | undefined {
    return this.#llmProviders.get(providerId)
  }
  getProviderByModel(model: ModelConfig): LLMProvider<unknown> | undefined {
    return this.#llmProviders.get(model.providerId)
  }
  setProvider(providerId: string, provider: LLMProvider<unknown>) {
    this.#llmProviders.set(providerId, provider)
  }
}

export * from "./llm/deepseek"
