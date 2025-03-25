import { ModelMeta, ModelType, ProviderName } from "@renderer/types"

export const modelsDefault = (): ModelMeta[] => {
  return [
    {
      id: `${ProviderName.DeepSeek}_deepseek-chat`,
      modelName: "deepseek-chat",
      type: ModelType.Chat,
      providerName: ProviderName.DeepSeek,
      subProviderName: ProviderName.DeepSeek,
      active: true,
    },
    {
      id: `${ProviderName.DeepSeek}_deepseek-reasoner`,
      modelName: "deepseek-reasoner",
      type: ModelType.ChatReasoner,
      providerName: ProviderName.DeepSeek,
      subProviderName: ProviderName.DeepSeek,
      active: true,
    },
  ]
}
