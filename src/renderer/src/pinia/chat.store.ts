import { defineStore, storeToRefs } from "pinia"
import { ChatTopic, Provider } from "@renderer/types"
import { useStorage } from "@vueuse/core"
import useProviderStore from "@renderer/pinia/provider.store"
import { useLLMChat } from "@renderer/lib/http"
export default defineStore("chat", () => {
  const providerStore = useProviderStore()
  const { providers } = storeToRefs(providerStore)
  const content = ref("") // 聊天框输入内容
  const topicList = useStorage<ChatTopic[]>("chat.topicList", []) // 聊天组列表
  const currentProvider = ref<Provider>(providers.value[0]) // 当前选择的服务提供商
  const requestHandler = useLLMChat(currentProvider.value)
  function send() {
    const responseHandler = requestHandler.request(content.value)
    responseHandler.onData(data => {
      console.log(data)
    })
    content.value = ""
  }
  function addGroup(group: ChatTopic) {
    topicList.value.push(group)
  }
  return {
    content,
    topicList,
    send,
    addGroup,
  }
})
