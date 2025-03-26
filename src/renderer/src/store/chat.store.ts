import { defineStore } from "pinia"
import { ChatMessage, ChatTopic } from "@renderer/types"
import { chatDefault } from "./default/chat.default"
import { useDebounceFn } from "@vueuse/core"
import { storeKey, useDatabase } from "@renderer/usable/useDatabase"
export default defineStore(storeKey.chat_topic, () => {
  const { getAll, add: dbAdd, put } = useDatabase()

  const topicList = reactive<ChatTopic[]>([]) // 聊天组列表
  // 当前聊天信息
  const chatMessage = ref<ChatMessage>()

  /**
   * @description 添加新聊天组
   */
  function add(group: ChatTopic) {
    topicList.push(group)
  }

  const dbUpdateChatTopic = useDebounceFn(
    async (data: ChatTopic) => await put("chat_topic", data.id, toRaw(data)),
    500,
    { maxWait: 1000 }
  )

  const fetch = async () => {
    try {
      const data = await getAll<ChatTopic>("chat_topic")
      if (data.length > 0) {
        topicList.push(...data)
      } else {
        const data = chatDefault()
        topicList.push(...data)
        for (const item of data) {
          await dbAdd("chat_topic", item)
        }
      }
    } catch (error) {
      console.error(`[fetch chat topic] ${(error as Error).message}`)
    }
  }

  fetch()
  return {
    topicList,
    add,
    dbUpdateChatTopic,
    chatMessage,
  }
})
