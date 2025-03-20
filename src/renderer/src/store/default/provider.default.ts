import { ProviderConfig, ProviderName } from "@renderer/types/model"
import ds from "@renderer/assets/images/provider/deepseek.svg"
export const providerDefault = (): ProviderConfig[] => {
  return [
    {
      id: `provider-${ProviderName.DeepSeek}`,
      name: ProviderName.DeepSeek,
      alias: "provider.name.deepseek",
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
      id: `provider-${ProviderName.SiliconFlow}`,
      name: ProviderName.SiliconFlow,
      alias: "provider.name.siliconflow",
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
    {
      id: `provider-${ProviderName.System}`,
      name: ProviderName.System,
      alias: "provider.name.system",
      logo: ds,
      apiUrl: "",
      apiKey: "",
      apiModelList: {
        method: "GET",
        url: "",
      },
      apiLLMChat: {
        method: "GET",
        url: "",
      },
      apiBalance: {
        method: "GET",
        url: "",
      },
    },
  ]
}
