import { IconifyJSON } from "@iconify/types"
import { getIconHTML } from "@renderer/components/SvgPicker"
import { ModelType, ProviderMeta, ProviderName, ModelActiveStatus } from "@renderer/types"
export const providerDefault = (providerSvgIcon: IconifyJSON): ProviderMeta[] => {
  return [
    {
      name: ProviderName.DeepSeek,
      alias: `provider.name.${ProviderName.DeepSeek}`,
      logo: getIconHTML(providerSvgIcon, "deepseek-color"),
      api: {
        doc: "https://api-docs.deepseek.com/zh-cn/",
        url: "https://api.deepseek.com",
        key: "",
        models: {
          method: "GET",
          url: "/models",
        },
        llmChat: {
          method: "POST",
          url: "/chat/completions",
        },
        balance: {
          method: "GET",
          url: "/user/balance",
        },
      },
      selectedTypes: [ModelType.Chat, ModelType.ChatReasoner],
      selectedSubProviders: [ProviderName.DeepSeek],
      activeStatus: ModelActiveStatus.All,
    },
    {
      name: ProviderName.SiliconFlow,
      alias: `provider.name.${ProviderName.SiliconFlow}`,
      logo: getIconHTML(providerSvgIcon, "siliconflow"),
      api: {
        doc: "https://docs.siliconflow.cn/cn/api-reference",
        url: "https://api.siliconflow.cn/v1",
        key: "",
        models: {
          method: "GET",
          url: "/models",
        },
        llmChat: {
          method: "POST",
          url: "/chat/completions",
        },
        balance: {
          method: "GET",
          url: "/user/info",
        },
      },
      selectedTypes: [ModelType.Chat, ModelType.ChatReasoner],
      selectedSubProviders: [],
      activeStatus: ModelActiveStatus.All,
    },
    {
      name: ProviderName.Volcengine,
      alias: `provider.name.${ProviderName.Volcengine}`,
      logo: getIconHTML(providerSvgIcon, "volcengine-color"),
      api: {
        doc: "https://www.volcengine.com/docs/82379/1263272",
        url: "https://ark.cn-beijing.volces.com/api/v3",
        key: "",
        models: {
          method: "GET",
          url: "",
        },
        llmChat: {
          method: "POST",
          url: "/chat/completions",
        },
        balance: {
          method: "GET",
          url: "",
        },
      },
      selectedTypes: [ModelType.Chat, ModelType.ChatReasoner],
      selectedSubProviders: [],
      activeStatus: ModelActiveStatus.All,
    },
    {
      name: ProviderName.OpenAI,
      alias: `provider.name.${ProviderName.OpenAI}`,
      logo: getIconHTML(providerSvgIcon, "openai"),
      api: {
        doc: "https://platform.openai.com/docs/api-reference",
        url: "https://api.openai.com",
        key: "",
        models: {
          method: "GET",
          url: "/models",
        },
        llmChat: {
          method: "POST",
          url: "/chat/completions",
        },
        balance: {
          method: "GET",
          url: "",
        },
      },
      selectedTypes: [],
      selectedSubProviders: [],
      activeStatus: ModelActiveStatus.All,
    },
  ]
}
