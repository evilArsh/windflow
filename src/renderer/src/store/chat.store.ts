import { defineStore } from "pinia"
import { ChatMessage, ChatTopic } from "@renderer/types"
import { chatTopicDefault } from "./default/chat.default"
import { useDebounceFn } from "@vueuse/core"
import { storeKey, useDatabase } from "@renderer/usable/useDatabase"
export default defineStore(storeKey.chat_topic, () => {
  const { getAll, add: dbAdd, put, get } = useDatabase()

  const topicList = reactive<ChatTopic[]>([]) // 聊天组列表
  const chatMessage = reactive<Record<string, ChatMessage>>({}) // 聊天信息缓存

  const dbUpdateChatTopic = useDebounceFn(
    async (data: ChatTopic) => await put("chat_topic", data.id, toRaw(data)),
    300,
    { maxWait: 1000 }
  )

  const dbAddChatTopic = useDebounceFn(async (data: ChatTopic) => await dbAdd("chat_topic", toRaw(data)), 300, {
    maxWait: 1000,
  })

  const dbAddChatMessage = useDebounceFn(async (data: ChatMessage) => await dbAdd("chat_message", toRaw(data)), 300, {
    maxWait: 1000,
  })

  const dbUpdateChatMessage = useDebounceFn(
    async (data: ChatMessage) => await put("chat_message", data.id, toRaw(data)),
    300,
    { maxWait: 1000 }
  )

  const dbFindChatMessage = async (id: string) => await get<ChatMessage>("chat_message", id)

  const fetch = async () => {
    try {
      const data = await getAll<ChatTopic>("chat_topic")
      if (data.length > 0) {
        topicList.push(...data)
      } else {
        const data = chatTopicDefault()
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
    dbUpdateChatTopic,
    dbAddChatTopic,
    dbFindChatMessage,
    dbAddChatMessage,
    dbUpdateChatMessage,
    chatMessage,
  }
})
