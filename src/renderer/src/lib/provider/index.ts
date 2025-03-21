import { LLMProvider, ModelConfig, ProviderName } from "@renderer/types"

export class ProviderManager {
  #llmProviders: Map<ProviderName, LLMProvider<unknown>>
  constructor() {
    this.#llmProviders = new Map()
  }
  getLLMProvider(providerName: ProviderName): LLMProvider<unknown> | undefined {
    return this.#llmProviders.get(providerName)
  }
  getLLMProviderByModel(model: ModelConfig): LLMProvider<unknown> | undefined {
    return this.#llmProviders.get(model.providerName)
  }
  setLLMProvider(providerName: ProviderName, provider: LLMProvider<unknown>) {
    this.#llmProviders.set(providerName, provider)
  }
}

export * from "./llm/deepseek"
