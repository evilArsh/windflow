import { ProviderMeta, ProviderName } from "@renderer/types"
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
    },
  ]
}
