import { ProviderConfig, ProviderName } from "@renderer/types/model"
import ds from "@renderer/assets/images/provider/deepseek.svg"
export const providerDefault = (): ProviderConfig[] => {
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
      modelIds: ["deepseek-chat", "deepseek-reasoner"],
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
      modelIds: [],
    },
    {
      name: ProviderName.System,
      alias: `provider.name.${ProviderName.System}`,
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
      modelIds: [],
    },
  ]
}
