import { ProviderMeta, ModelMeta, MediaResponse, RequestHandler, MediaRequest } from "@renderer/types"
import { Compatible } from "./compatible"

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
  async textToImage(
    _message: MediaRequest,
    _model: ModelMeta,
    _provider: ProviderMeta,
    _callback: (message: MediaResponse) => void
  ): Promise<RequestHandler> {
    return { terminate: () => {} }
  }
}
