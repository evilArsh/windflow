import { ProviderMeta, ModelMeta, ImageResponse, RequestHandler, MediaRequest } from "@renderer/types"
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
    _callback: (message: ImageResponse) => void
  ): Promise<RequestHandler> {
    return { terminate: () => {} }
  }
}
