import { Provider, ProviderName } from "@renderer/types"
import { defineStore } from "pinia"
import ds from "@renderer/assets/images/provider/deepseek.svg"
import { useStorage } from "@vueuse/core"
export default defineStore("provider", () => {
  // const providers = reactive<Provider[]>([
  const providers = useStorage<Provider[]>("chat.providers", [
    {
      id: uniqueId(),
      name: ProviderName.DeepSeek,
      alias: "",
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

  return {
    providers,
    editProvider,
  }
})
