import { Provider, ProviderManager } from "@windflow/core/types"
import { DeepSeek } from "./deepseek"
import { SiliconFlow } from "./siliconflow"
import { Volcengine } from "./volcengine"
import { OpenAI } from "./openai/index"
class ProviderManagerImpl implements ProviderManager {
  #providers: Map<string, Provider>
  constructor() {
    this.#providers = new Map()

    const deepseek = new DeepSeek()
    const siliconflow = new SiliconFlow()
    const volcengine = new Volcengine()
    const openai = new OpenAI()

    this.#providers.set(deepseek.name(), deepseek)
    this.#providers.set(siliconflow.name(), siliconflow)
    this.#providers.set(volcengine.name(), volcengine)
    this.#providers.set(openai.name(), openai)
  }
  getProvider(providerName: string): Provider | undefined {
    return this.#providers.get(providerName)
  }
  getAvailable(): Provider[] {
    return Array.from(this.#providers.values())
  }
}

export function createProviderManager(): ProviderManager {
  return new ProviderManagerImpl()
}
