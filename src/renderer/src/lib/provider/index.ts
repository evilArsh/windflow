import { LLMProvider, Provider, ProviderName } from "@renderer/types"
import { DeepSeek } from "./deepseek"
import { SiliconFlow } from "./siliconflow"
import { Volcengine } from "./volcengine"
import { OpenAI } from "./openai"
export class ProviderManager {
  #providers: Map<ProviderName, Provider>
  #llmProviders: WeakSet<LLMProvider>
  constructor() {
    this.#providers = new Map()
    this.#llmProviders = new WeakSet()

    const deepseek = markRaw(new DeepSeek())
    const siliconflow = markRaw(new SiliconFlow())
    const volcengine = markRaw(new Volcengine())
    const openai = markRaw(new OpenAI())

    this.#providers.set(ProviderName.DeepSeek, deepseek)
    this.#providers.set(ProviderName.SiliconFlow, siliconflow)
    this.#providers.set(ProviderName.Volcengine, volcengine)
    this.#providers.set(ProviderName.OpenAI, openai)

    this.#llmProviders.add(deepseek)
    this.#llmProviders.add(siliconflow)
    this.#llmProviders.add(volcengine)
    this.#llmProviders.add(openai)
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
