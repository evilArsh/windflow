import { ProviderMeta, ModelMeta, ModelType, ModelsResponse } from "@renderer/types"
import { Compatible } from "./compatible"
import { patchAxios } from "./compatible/utils"
import { BridgeResponse } from "@shared/types/bridge"

export class DeepSeek extends Compatible {
  constructor() {
    super()
  }
  name(): string {
    return "deepseek"
  }
  async fetchModels(provider: ProviderMeta): Promise<ModelMeta[]> {
    patchAxios(provider, this.axios)
    const res = await this.axios.request<ModelsResponse>({
      method: provider.api.models.method,
      url: provider.api.models.url,
    })
    return res.data.data.map<ModelMeta>((v: ModelsResponse["data"][number]) => ({
      id: `${provider.name}_${v.id}`,
      type: [v.id === "deepseek-chat" ? ModelType.Chat : ModelType.ChatReasoner],
      modelName: v.id,
      providerName: provider.name,
      subProviderName: provider.name,
    }))
  }
  async textToImage(_text: string, _modelMeta: ModelMeta, _provider: ProviderMeta): Promise<BridgeResponse<string>> {
    return { code: 404, msg: "not supported", data: "" }
  }
}
