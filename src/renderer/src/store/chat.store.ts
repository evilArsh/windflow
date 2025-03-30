import { defineStore } from "pinia"
import { ChatMessage, ChatTopic, ChatTopicTree } from "@renderer/types"
import { chatTopicDefault } from "./default/chat.default"
import { useDebounceFn, useThrottleFn } from "@vueuse/core"
import { indexKey, storeKey, useDatabase } from "@renderer/usable/useDatabase"

function topicToTree(topic: ChatTopic): ChatTopicTree {
  return { id: topic.id, node: topic, children: [] }
}

function assembleTopicTree(data: ChatTopic[]): ChatTopicTree[] {
  const res: ChatTopicTree[] = []
  const maps: Record<string, ChatTopicTree> = {}
  data.forEach(item => {
    maps[item.id] = topicToTree(item)
  })
  data.forEach(item => {
    if (!item.parentId) {
      res.push(maps[item.id])
    } else {
      if (maps[item.parentId]) {
        maps[item.parentId].children.push(maps[item.id])
      }
    }
  })
  return res
}
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
   * @description 获取子节点数量
   */
  const dbChildCount = async (parentId: string) =>
    (await request<number>(async db => {
      return await wrapRequest<number>(
        db
          .transaction(storeKey.chat_topic, "readonly")
          .objectStore(storeKey.chat_topic)
          .index(indexKey.chatTopic_parentId_idx)
          .count(IDBKeyRange.only(parentId))
      )
    })) ?? 0
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
          const index = db
            .transaction(storeKey.chat_topic, "readonly")
            .objectStore(storeKey.chat_topic)
            .index(indexKey.chatTopic_createAt_idx)
          const res = await new Promise<ChatTopic[]>(resolve => {
            const results: ChatTopic[] = []
            index.openCursor(null, "next").onsuccess = e => {
              const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
              if (cursor) {
                results.push(cursor.value as ChatTopic)
                cursor.continue()
              } else {
                resolve(results)
              }
            }
          })
          return res
        })
        data && topicList.push(...assembleTopicTree(data))
      } else {
        const data = chatTopicDefault()
        topicList.push(...assembleTopicTree(data))
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
    chatMessage,
    dbUpdateChatTopic,
    dbAddChatTopic,
    dbFindChatMessage,
    dbAddChatMessage,
    dbUpdateChatMessage,
    dbDelChatTopic,
    dbChildCount,
  }
})
