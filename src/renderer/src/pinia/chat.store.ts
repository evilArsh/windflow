import { defineStore } from "pinia"
import { ChatTopic } from "@renderer/types"
import { useStorage } from "@vueuse/core"
export default defineStore("chat", () => {
  const topicList = useStorage<ChatTopic[]>("chat.topicList", []) // 聊天组列表
  function addGroup(group: ChatTopic) {
    topicList.value.push(group)
  }
  return {
    topicList,
    addGroup,
  }
})
