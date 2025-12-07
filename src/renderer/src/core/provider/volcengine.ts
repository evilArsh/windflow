import { ProviderMeta, ModelMeta, ImageResponse, RequestHandler, MediaRequest } from "../types"
import { Compatible } from "./compatible"
import { useHandler } from "./openai/request"

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
    return useHandler()
  }
}
