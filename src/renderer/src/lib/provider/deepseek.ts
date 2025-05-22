import { ProviderMeta, ModelMeta, ModelType, ModelsResponse } from "@renderer/types"
import { Compatible } from "./compatible"
import { patchAxios } from "./compatible/utils"

export class DeepSeek extends Compatible {
  constructor() {
    super()
  }
  async fetchModels(provider: ProviderMeta): Promise<ModelMeta[]> {
    patchAxios(provider, this.axios)
    const res = await this.axios.request<ModelsResponse>({
      method: provider.apiModelList.method,
      url: provider.apiModelList.url,
    })
    return res.data.data.map<ModelMeta>((v: ModelsResponse["data"][number]) => ({
      id: `${provider.name}_${v.id}`,
      type: [v.id === "deepseek-chat" ? ModelType.Chat : ModelType.ChatReasoner],
      modelName: v.id,
      providerName: provider.name,
      subProviderName: provider.name,
    }))
  }
}
