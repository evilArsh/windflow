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
    {
      id: `${ProviderName.Volcengine}_deepseek-r1`,
      modelName: "deepseek-r1-250120",
      type: ModelType.ChatReasoner,
      providerName: ProviderName.Volcengine,
      subProviderName: ProviderName.DeepSeek,
      active: true,
    },
    {
      id: `${ProviderName.Volcengine}_deepseek-v3`,
      modelName: "deepseek-v3-250324",
      type: ModelType.Chat,
      providerName: ProviderName.Volcengine,
      subProviderName: ProviderName.DeepSeek,
      active: true,
    },
    {
      id: `${ProviderName.Volcengine}_deepseek-r1-distill-qwen-7b`,
      modelName: "deepseek-r1-distill-qwen-7b-250120",
      type: ModelType.ChatReasoner,
      providerName: ProviderName.Volcengine,
      subProviderName: ProviderName.DeepSeek,
      active: true,
    },
    {
      id: `${ProviderName.Volcengine}_deepseek-r1-distill-qwen-32b`,
      modelName: "deepseek-r1-distill-qwen-32b-250120",
      type: ModelType.ChatReasoner,
      providerName: ProviderName.Volcengine,
      subProviderName: ProviderName.DeepSeek,
      active: true,
    },
  ]
}
