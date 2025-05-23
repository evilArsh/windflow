import { ProviderMeta, ModelMeta } from "@renderer/types"
import { Compatible } from "./compatible"
import { BridgeResponse } from "@shared/types/bridge"

export class Volcengine extends Compatible {
  constructor() {
    super()
  }
  name(): string {
    return "volcengine"
  }
  async fetchModels(_provider: ProviderMeta): Promise<ModelMeta[]> {
    return []
  }
  async textToImage(_text: string, _modelMeta: ModelMeta, _provider: ProviderMeta): Promise<BridgeResponse<string>> {
    return { code: 404, msg: "not supported", data: "" }
  }
}
