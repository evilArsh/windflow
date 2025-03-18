import { Provider, ProviderName } from "@renderer/types"
import { defineStore } from "pinia"
import ds from "@renderer/assets/images/provider/deepseek.svg"
import { useStorage } from "@vueuse/core"
export default defineStore("provider", () => {
  const defaultProviderId = shallowRef<string>(`provider-${ProviderName.DeepSeek}`) // 默认提供商
  const providers = useStorage<Provider[]>("chat.providers", [
    {
      id: `provider-${ProviderName.DeepSeek}`,
      name: ProviderName.DeepSeek,
      // alias: t("provider.name.deepseek"),
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
      id: `provider-${ProviderName.System}`,
      name: ProviderName.System,
      // alias: t("provider.name.system"),
      logo: ds,
      apiUrl: "",
      apiKey: "",
      apiModelList: {
        method: "",
        url: "",
      },
      apiLLMChat: {
        method: "",
        url: "",
      },
      apiBalance: {
        method: "",
        url: "",
      },
    },
  ])
  // 正在编辑的provider
  const editProvider = ref<Provider>({
    id: "",
    name: "",
    alias: "",
    logo: "",
    apiUrl: "",
    apiKey: "",
    apiModelList: {
      method: "",
      url: "",
    },
    apiLLMChat: {
      method: "",
      url: "",
    },
    apiBalance: {
      method: "",
      url: "",
    },
  })

  function findById(id: string) {
    return providers.value.find(v => v.id === id)
  }

  return {
    providers,
    editProvider,
    defaultProviderId,
    findById,
  }
})
