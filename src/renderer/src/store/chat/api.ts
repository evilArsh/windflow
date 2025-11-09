import { ChatLLMConfig, ChatMessage, ChatMessageTree, ChatTopic, ChatTopicTree, ChatTTIConfig } from "@renderer/types"
import { db } from "@renderer/db"
import PQueue from "p-queue"
import { chatTopicDefault } from "./default"
import { cloneDeep } from "@toolmain/shared"

export const useData = () => {
  const queue = markRaw(new PQueue({ concurrency: 1 }))
  const mqueue = markRaw(new PQueue({ concurrency: 1 }))
  const cnfQueue = markRaw(new PQueue({ concurrency: 1 }))

  async function addChatTopic(data: ChatTopic) {
    return db.chatTopic.add(cloneDeep(data))
  }
  async function addChatMessage(data: ChatMessage) {
    return db.chatMessage.add(cloneDeep(data))
  }
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const addChatLLMConfig = async (data: ChatLLMConfig) =>
    cnfQueue.add(async () => db.chatLLMConfig.add(cloneDeep(data)))
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const addChatTTIConfig = async (data: ChatTTIConfig) =>
    cnfQueue.add(async () => db.chatTTIConfig.add(cloneDeep(data)))
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const putChatTopic = async (data: ChatTopic) => queue.add(async () => db.chatTopic.put(cloneDeep(data)))
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const putChatMessage = async (data: ChatMessage) => mqueue.add(async () => db.chatMessage.put(cloneDeep(data)))
  const bulkPutChatMessage = async (data: ChatMessage[]) =>
    queue.add(async () => db.chatMessage.bulkPut(cloneDeep(data)))
  async function updateChatLLMConfig(data: ChatLLMConfig) {
    return db.chatLLMConfig.put(cloneDeep(data))
  }
  async function updateChatTTIConfig(data: ChatTTIConfig) {
    return db.chatTTIConfig.put(cloneDeep(data))
  }
  async function getChatTTIConfig(topicId: string) {
    return db.chatTTIConfig.where("topicId").equals(topicId).first()
  }
  async function getChatLLMConfig(topicId: string) {
    return db.chatLLMConfig.where("topicId").equals(topicId).first()
  }
  /**
   * @description 查找对应的聊天消息
   */
  async function getChatMessage(topicId: string) {
    const messageList: ChatMessageTree[] = []
    const assembleMessageTree = (data: ChatMessage[], cb: (item: ChatMessageTree) => void): ChatMessageTree[] => {
      const res: ChatMessageTree[] = []
      const maps: Record<string, ChatMessageTree> = {}
      data.forEach(item => {
        maps[item.id] = { id: item.id, node: item, children: [] }
        cb(maps[item.id])
      })
      data.forEach(item => {
        if (!item.parentId) {
          res.push(maps[item.id])
        } else {
          if (maps[item.parentId]) {
            maps[item.parentId].children.push(maps[item.id])
            maps[item.parentId].children.sort((a, b) => a.node.index - b.node.index)
          }
        }
      })
      return res
    }
    const res = (await db.chatMessage.where("topicId").equals(topicId).sortBy("index")).reverse()
    messageList.push(
      ...assembleMessageTree(res, item => {
        item.node.finish = true
        item.node.status = 200
      })
    )
    return messageList
  }
  async function deleteChatMessage(messageId: string) {
    return db.chatMessage.delete(messageId)
  }
  async function bulkDeleteChatMessage(messageIds: string[]) {
    return db.chatMessage.bulkDelete(messageIds)
  }
  async function deleteAllMessages(topicId: string) {
    return db.chatMessage.where("topicId").equals(topicId).delete()
  }
  async function getTopic(topicId: string) {
    return db.chatTopic.get(topicId)
  }
  /**
   * @description 删除对应的聊天组和聊天消息
   */
  async function delChatTopic(data: ChatTopic[]) {
    return db.transaction("rw", db.chatMessage, db.chatTopic, db.chatLLMConfig, db.chatTTIConfig, async trans => {
      for (const item of data) {
        await trans.chatTopic.delete(item.id)
        await trans.chatMessage.where("topicId").equals(item.id).delete()
        await trans.chatLLMConfig.where("topicId").equals(item.id).delete()
        await trans.chatTTIConfig.where("topicId").equals(item.id).delete()
      }
    })
  }
  const fetch = async () => {
    const topicList: ChatTopicTree[] = []
    const assembleTopicTree = (data: ChatTopic[], cb: (item: ChatTopicTree) => void): ChatTopicTree[] => {
      const res: ChatTopicTree[] = []
      const maps: Record<string, ChatTopicTree> = {}
      data.forEach(item => {
        maps[item.id] = { id: item.id, node: item, children: [] }
        cb(maps[item.id])
      })
      data.forEach(item => {
        if (!item.parentId) {
          res.push(maps[item.id])
        } else {
          if (maps[item.parentId]) {
            maps[item.parentId].children.push(maps[item.id])
            maps[item.parentId].children.sort((a, b) => a.node.index - b.node.index)
          }
        }
      })
      return res
    }
    const data = await db.chatTopic.toCollection().sortBy("index")
    const defaultData = chatTopicDefault()
    const newDefault: ChatTopic[] = []
    for (const item of defaultData) {
      if (!data.find(v => v.id === item.id)) {
        newDefault.push(item)
      }
    }
    if (newDefault.length) {
      data.push(...newDefault)
      await db.chatTopic.bulkAdd(newDefault)
    }
    topicList.push(
      ...assembleTopicTree(data, item => {
        item.node.requestCount = 0
      })
    )
    return topicList
  }
  return {
    fetch,
    addChatTopic,
    addChatMessage,
    addChatLLMConfig,
    addChatTTIConfig,
    putChatTopic,
    putChatMessage,
    bulkPutChatMessage,
    updateChatLLMConfig,
    updateChatTTIConfig,
    getTopic,
    getChatMessage,
    getChatTTIConfig,
    getChatLLMConfig,
    delChatTopic,
    deleteChatMessage,
    deleteAllMessages,
    bulkDeleteChatMessage,
  }
}
