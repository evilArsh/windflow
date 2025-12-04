import { Provider } from "@renderer/types"
import { DeepSeek } from "./deepseek"
import { SiliconFlow } from "./siliconflow"
import { Volcengine } from "./volcengine"
import { OpenAI } from "./openai/index"
export class ProviderManager {
  #providers: Map<string, Provider>
  constructor() {
    this.#providers = new Map()

    const deepseek = markRaw(new DeepSeek())
    const siliconflow = markRaw(new SiliconFlow())
    const volcengine = markRaw(new Volcengine())
    const openai = markRaw(new OpenAI())

    this.#providers.set(deepseek.name(), deepseek)
    this.#providers.set(siliconflow.name(), siliconflow)
    this.#providers.set(volcengine.name(), volcengine)
    this.#providers.set(openai.name(), openai)
  }
  getProvider(providerName: string): Provider | undefined {
    return this.#providers.get(providerName)
  }
  availableProviders(): Provider[] {
    return Array.from(this.#providers.values())
  }
}
