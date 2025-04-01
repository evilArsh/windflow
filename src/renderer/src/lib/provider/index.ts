import { LLMProvider, Provider, ProviderName } from "@renderer/types"
import { LLMDeepSeek } from "./deepseek"
import { SiliconFlow } from "./siliconflow"
export class ProviderManager {
  #providers: Map<ProviderName, Provider>
  #llmProviders: WeakSet<LLMProvider>
  constructor() {
    console.log("[ProviderManager init]")
    this.#providers = new Map()
    this.#llmProviders = new WeakSet()

    const deepseek = markRaw(new LLMDeepSeek())
    const siliconflow = markRaw(new SiliconFlow())

    this.#providers.set(ProviderName.DeepSeek, deepseek)
    this.#providers.set(ProviderName.SiliconFlow, siliconflow)

    this.#llmProviders.add(deepseek)
    this.#llmProviders.add(siliconflow)
  }
  getLLMProvider(providerName: ProviderName): LLMProvider | undefined {
    const provider = this.#providers.get(providerName)
    if (!provider) return
    if (this.#llmProviders.has(provider as LLMProvider)) {
      return provider as LLMProvider
    }
    return undefined
  }
  setLLMProvider(providerName: ProviderName, provider: LLMProvider) {
    this.#providers.set(providerName, provider)
    this.#llmProviders.add(provider)
  }
}

export * from "./deepseek"
