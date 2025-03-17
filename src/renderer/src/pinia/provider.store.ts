import { Provider } from "@renderer/types"
import { defineStore } from "pinia"
import ds from "@renderer/assets/images/provider/deepseek.svg"
import { useStorage } from "@vueuse/core"

export default defineStore("provider", () => {
  const providers = useStorage<Provider[]>("setting.providers", [
    {
      id: uniqueId(),
      name: "DeepSeek",
      alias: "",
      logo: ds,
      apiUrl: "https://api.deepseek.com",
      apiKey: "",
    },
  ])
  const editForm = ref<Provider>(defaultProvider()) // 正在编辑的provider

  function addProvider(provider: Provider) {
    providers.value.push(provider)
  }
  function removeProvider(provider: Provider) {
    providers.value = providers.value.filter(p => p.name !== provider.name)
  }

  function defaultProvider(): Provider {
    return {
      id: uniqueId(),
      name: "",
      alias: "",
      logo: "",
      apiUrl: "",
      apiKey: "",
    }
  }
  return {
    providers,
    editForm,
    addProvider,
    removeProvider,
  }
})
