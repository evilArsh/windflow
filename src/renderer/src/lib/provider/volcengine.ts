import { ProviderMeta, ModelMeta } from "@renderer/types"
import { Compatible } from "./compatible"

export class Volcengine extends Compatible {
  constructor() {
    super()
  }
  async fetchModels(_provider: ProviderMeta): Promise<ModelMeta[]> {
    return []
  }
}
