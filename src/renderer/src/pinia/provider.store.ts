import { Provider } from "@renderer/types"
import useI18nWatcher from "@renderer/usable/useI18nWatcher"
import { defineStore } from "pinia"
import ds from "@renderer/assets/images/provider/deepseek.svg"

export default defineStore("provider", () => {
  const providers = ref<Provider[]>([])
  const editForm = ref<Provider>(defaultProvider()) // 正在编辑的provider

  function addProvider(provider: Provider) {
    providers.value.push(provider)
  }
  function removeProvider(provider: Provider) {
    providers.value = providers.value.filter(p => p.name !== provider.name)
  }

  function defaultProvider(): Provider {
    return {
      name: "",
      alias: "",
      logo: "",
      apiUrl: "",
      apiKey: "",
    }
  }
  function updateProvider() {
    providers.value = [
      {
        name: "DeepSeek",
        alias: "",
        logo: ds,
        apiUrl: "https://api.deepseek.com",
        apiKey: "",
      },
    ]
  }
  useI18nWatcher(updateProvider)
  return {
    providers,
    editForm,
    addProvider,
    removeProvider,
  }
})
