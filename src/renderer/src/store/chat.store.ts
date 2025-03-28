import { defineStore } from "pinia"
import { ChatMessage, ChatTopic, ChatTopicTree } from "@renderer/types"
import { chatTopicDefault } from "./default/chat.default"
import { useDebounceFn, useThrottleFn } from "@vueuse/core"
import { indexKey, storeKey, useDatabase } from "@renderer/usable/useDatabase"
export default defineStore(storeKey.chat_topic, () => {
  const { add: dbAdd, put, get, request, wrapRequest, count } = useDatabase()

  const topicList = reactive<Array<ChatTopicTree>>([]) // 聊天组列表
  const chatMessage = reactive<Record<string, ChatMessage>>({}) // 聊天信息缓存

  const dbUpdateChatTopic = useThrottleFn(
    async (data: ChatTopic) => await put("chat_topic", data.id, toRaw(data)),
    300,
    true
  )
  const dbAddChatTopic = async (data: ChatTopic) => await dbAdd("chat_topic", toRaw(data))
  const dbAddChatMessage = async (data: ChatMessage) => await dbAdd("chat_message", toRaw(data))
  const dbUpdateChatMessage = useDebounceFn(
    async (data: ChatMessage) => await put("chat_message", data.id, toRaw(data)),
    300,
    { maxWait: 1000 }
  )
  const dbFindChatMessage = async (id: string) => await get<ChatMessage>("chat_message", id)
  /**
   * @description 删除对应的聊天组和聊天消息
   */
  const dbDelChatTopic = async (data: ChatTopic) =>
    await request(async db => {
      const ts = db.transaction([storeKey.chat_message, storeKey.chat_topic], "readwrite")
      const res = await wrapRequest(ts.objectStore(storeKey.chat_topic).delete(data.id))
      if (res === null) {
        return 0
      }
      if (data.chatMessageId) {
        const res = await wrapRequest(ts.objectStore(storeKey.chat_message).delete(data.chatMessageId))
        if (res === null) {
          return 0
        }
      }
      return 1
    })
  const fetch = async () => {
    try {
      const total = await count("chat_topic")
      if (total > 0) {
        const data = await request<ChatTopic[]>(async db => {
          return wrapRequest<ChatTopic[]>(
            db
              .transaction(storeKey.chat_topic, "readonly")
              .objectStore("chat_topic")
              .index(indexKey.chatTopic_parentId_idx)
              .getAll(IDBKeyRange.only(""))
          )
        })
        if (Array.isArray(data)) {
          topicList.push(...(data.map(item => ({ id: item.id, node: item, children: [] })) ?? []))
        }
      } else {
        const data = chatTopicDefault()
        topicList.push(...(data.map(item => ({ id: item.id, node: item, children: [] })) ?? []))
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
    dbDelChatTopic,
  }
})
