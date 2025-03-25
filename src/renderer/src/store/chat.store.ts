import { defineStore } from "pinia"
import { ChatTopic } from "@renderer/types"
import useDataStorage from "@renderer/usable/useDataStorage"
import { merge } from "lodash-es"
import { chatDefault } from "./default/chat.default"
import { useThrottleFn } from "@vueuse/core"
export default defineStore("chat", () => {
  const { save, get } = useDataStorage()
  const SAVE_KEY = "chat.topicList"
  const topicList = reactive<ChatTopic[]>([]) // 聊天组列表

  function add(group: ChatTopic) {
    topicList.push(group)
  }

  function find(id: string) {
    return topicList.find(v => v.id === id)
  }

  const init = async () => {
    const data = await get<ChatTopic[]>(SAVE_KEY)
    topicList.push(...merge(chatDefault(), data))
  }
  watch(
    topicList,
    useThrottleFn(
      () => {
        save<ChatTopic[]>(SAVE_KEY, toRaw(topicList))
      },
      300,
      true
    )
  )
  init()
  return {
    topicList,
    add,
    find,
  }
})
