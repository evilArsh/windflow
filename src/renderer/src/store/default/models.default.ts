import { ModelConfig, ModelType, ProviderName } from "@renderer/types"

export const modelsDefault = (): ModelConfig[] => {
  return [
    {
      id: "deepseek-chat",
      name: "deepseek-chat",
      type: ModelType.LLM_CHAT,
      providerName: ProviderName.DeepSeek,
    },
    {
      id: "deepseek-reasoner",
      name: "deepseek-reasoner",
      type: ModelType.LLM_REASONER,
      providerName: ProviderName.DeepSeek,
    },
  ]
}
