import { ProviderMeta, ModelMeta, ProviderName } from "@renderer/types"
import { modelsDefault } from "@renderer/store/default/models.default"
import { OpenAICompatible } from "./openai"

export class Volcengine extends OpenAICompatible {
  constructor() {
    super()
  }
  async fetchModels(_provider: ProviderMeta): Promise<ModelMeta[]> {
    return modelsDefault().filter(v => v.providerName === ProviderName.Volcengine)
  }
}
