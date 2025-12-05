import { ChatLLMConfig, ChatMessage, ChatMessageTree, ChatTopic, ChatTopicTree, ChatTTIConfig } from "@renderer/types"
import { db } from "@renderer/db"
import PQueue from "p-queue"
import { chatTopicDefault } from "../presets/chat"
import { cloneDeep } from "@toolmain/shared"

const topicQueue = markRaw(new PQueue({ concurrency: 1 }))
const msgQueue = markRaw(new PQueue({ concurrency: 1 }))
const configQueue = markRaw(new PQueue({ concurrency: 1 }))
export async function addChatTopic(data: ChatTopic) {
  return topicQueue.add(async () => db.chatTopic.add(cloneDeep(data)))
}
export async function putChatTopic(data: ChatTopic) {
  return topicQueue.add(async () => db.chatTopic.put(cloneDeep(data)))
}

export async function addChatMessage(data: ChatMessage) {
  return msgQueue.add(async () => db.chatMessage.add(cloneDeep(data)))
}
export async function putChatMessage(data: ChatMessage) {
  return msgQueue.add(async () => db.chatMessage.put(cloneDeep(data)))
}
export async function bulkPutChatMessage(data: ChatMessage[]) {
  return msgQueue.add(async () => db.chatMessage.bulkPut(cloneDeep(data)))
}

export async function addChatLLMConfig(data: ChatLLMConfig) {
  return configQueue.add(async () => db.chatLLMConfig.add(cloneDeep(data)))
}
export async function getChatLLMConfig(topicId: string) {
  return configQueue.add(async () => db.chatLLMConfig.where("topicId").equals(topicId).first())
}
export async function updateChatLLMConfig(data: ChatLLMConfig) {
  return configQueue.add(async () => db.chatLLMConfig.put(cloneDeep(data)))
}

export async function addChatTTIConfig(data: ChatTTIConfig) {
  return configQueue.add(async () => db.chatTTIConfig.add(cloneDeep(data)))
}
export async function updateChatTTIConfig(data: ChatTTIConfig) {
  return configQueue.add(async () => db.chatTTIConfig.put(cloneDeep(data)))
}
export async function getChatTTIConfig(topicId: string) {
  return configQueue.add(async () => db.chatTTIConfig.where("topicId").equals(topicId).first())
}

/**
 * @description 查找对应的聊天消息
 */
export async function getChatMessage(topicId: string) {
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
export async function deleteChatMessage(messageId: string) {
  return db.chatMessage.delete(messageId)
}
export async function bulkDeleteChatMessage(messageIds: string[]) {
  return db.chatMessage.bulkDelete(messageIds)
}
export async function deleteAllMessages(topicId: string) {
  return db.chatMessage.where("topicId").equals(topicId).delete()
}
export async function getTopic(topicId: string) {
  return db.chatTopic.get(topicId)
}
/**
 * @description 删除对应的聊天组和聊天消息
 */
export async function delChatTopic(data: ChatTopic[]) {
  return db.transaction("rw", db.chatMessage, db.chatTopic, db.chatLLMConfig, db.chatTTIConfig, async trans => {
    for (const item of data) {
      await trans.chatTopic.delete(item.id)
      await trans.chatMessage.where("topicId").equals(item.id).delete()
      await trans.chatLLMConfig.where("topicId").equals(item.id).delete()
      await trans.chatTTIConfig.where("topicId").equals(item.id).delete()
    }
  })
}
export async function fetch() {
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
