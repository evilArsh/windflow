import { ModelType, ProviderMeta, ProviderName, ModelActiveStatus } from "@renderer/types"
import ds from "@renderer/assets/images/provider/deepseek.svg"
export const providerDefault = (): ProviderMeta[] => {
  return [
    {
      name: ProviderName.DeepSeek,
      alias: `provider.name.${ProviderName.DeepSeek}`,
      logo: ds,
      apiUrl: "https://api.deepseek.com",
      apiKey: "",
      apiModelList: {
        method: "GET",
        url: "/models",
      },
      apiLLMChat: {
        method: "POST",
        url: "/chat/completions",
      },
      apiBalance: {
        method: "GET",
        url: "/user/balance",
      },
      selectedTypes: [ModelType.Chat, ModelType.ChatReasoner],
      selectedSubProviders: [ProviderName.DeepSeek],
      activeStatus: ModelActiveStatus.All,
    },
    {
      name: ProviderName.SiliconFlow,
      alias: `provider.name.${ProviderName.SiliconFlow}`,
      logo: ds,
      apiUrl: "https://api.siliconflow.cn/v1",
      apiKey: "",
      apiModelList: {
        method: "GET",
        url: "/models",
      },
      apiLLMChat: {
        method: "POST",
        url: "/chat/completions",
      },
      apiBalance: {
        method: "GET",
        url: "/user/info",
      },
      selectedTypes: [ModelType.Chat, ModelType.ChatReasoner],
      selectedSubProviders: [],
      activeStatus: ModelActiveStatus.All,
    },
  ]
}
