import { defineStore } from "pinia"
import { ChatGroup } from "@renderer/types"
export default defineStore("chat", () => {
  const groups = ref<ChatGroup[]>([])

  const content = ref("") // 聊天框输入内容
  // const providers = ref<Provider[]>([]) // 当前选择的服务提供商
  function send() {
    // TODO: 发送请求
    content.value = ""
  }
  function addGroup(group: ChatGroup) {
    groups.value.push(group)
  }
  return {
    content,
    groups,
    send,
    addGroup,
  }
})
