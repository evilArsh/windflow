import { ChatLLMConfig, ChatMessage, ChatTopic, ChatTTIConfig, QueryParams } from "@windflow/core/types"
import { db } from "../index"
import PQueue from "p-queue"
import { cloneDeep } from "@toolmain/shared"
import { resolveDb } from "../utils"
import Dexie from "dexie"

const topicQueue = new PQueue({ concurrency: 1 })
const msgQueue = new PQueue({ concurrency: 1 })
const configQueue = new PQueue({ concurrency: 1 })
export async function addChatTopic(data: ChatTopic, params?: QueryParams) {
  return topicQueue.add(async () => resolveDb(params).chatTopic.add(cloneDeep(data)))
}
export async function bulkAddChatTopics(datas: ChatTopic[], params?: QueryParams) {
  return topicQueue.add(async () => resolveDb(params).chatTopic.bulkAdd(cloneDeep(datas)))
}
export async function putChatTopic(data: ChatTopic, params?: QueryParams) {
  return topicQueue.add(async () => resolveDb(params).chatTopic.put(cloneDeep(data)))
}
export async function bulkPutChatTopic(datas: ChatTopic[], params?: QueryParams) {
  return topicQueue.add(async () => resolveDb(params).chatTopic.bulkPut(cloneDeep(datas)))
}
export async function getTopic(topicId: string) {
  return topicQueue.add(async () => db.chatTopic.get(topicId))
}
export async function addChatLLMConfig(data: ChatLLMConfig, params?: QueryParams) {
  return configQueue.add(async () => resolveDb(params).chatLLMConfig.add(cloneDeep(data)))
}
export async function getChatLLMConfig(topicId: string) {
  return configQueue.add(async () => db.chatLLMConfig.where("topicId").equals(topicId).first())
}
export async function putChatLLMConfig(data: ChatLLMConfig, params?: QueryParams) {
  return configQueue.add(async () => resolveDb(params).chatLLMConfig.put(cloneDeep(data)))
}

export async function addChatTTIConfig(data: ChatTTIConfig, params?: QueryParams) {
  return configQueue.add(async () => resolveDb(params).chatTTIConfig.add(cloneDeep(data)))
}
export async function putChatTTIConfig(data: ChatTTIConfig, params?: QueryParams) {
  return configQueue.add(async () => resolveDb(params).chatTTIConfig.put(cloneDeep(data)))
}
export async function getChatTTIConfig(topicId: string) {
  return configQueue.add(async () => db.chatTTIConfig.where("topicId").equals(topicId).first())
}

export async function addChatMessage(data: ChatMessage, params?: QueryParams) {
  return msgQueue.add(async () => resolveDb(params).chatMessage.add(cloneDeep(data)))
}
export async function putChatMessage(data: ChatMessage, params?: QueryParams) {
  return msgQueue.add(async () => resolveDb(params).chatMessage.put(cloneDeep(data)))
}
export async function updateChatMessage(id: string, data: Partial<ChatMessage>, params?: QueryParams) {
  const cdata = cloneDeep(data)
  delete cdata.id
  return msgQueue.add(async () => resolveDb(params).chatMessage.update(id, cdata))
}
export async function bulkPutChatMessage(data: ChatMessage[], params?: QueryParams) {
  return msgQueue.add(async () => resolveDb(params).chatMessage.bulkPut(cloneDeep(data)))
}
export async function bulkAddChatMessage(data: ChatMessage[], params?: QueryParams) {
  return msgQueue.add(async () => resolveDb(params).chatMessage.bulkAdd(cloneDeep(data)))
}
/**
 * @description get all messages of a topic and sort by `index`
 */
export async function getChatMessages(topicId: string) {
  return msgQueue.add(async () => db.chatMessage.where("topicId").equals(topicId).sortBy("index"))
}
/**
 * @description get message by `messageId` in a topic
 */
export async function getChatMessage(messageId: string): Promise<ChatMessage | undefined> {
  return msgQueue.add(async () => db.chatMessage.where("id").equals(messageId).first())
}
export async function deleteChatMessage(messageId: string, params?: QueryParams) {
  return msgQueue.add(async () => resolveDb(params).chatMessage.delete(messageId))
}
export async function bulkDeleteChatMessage(messageIds: string[], params?: QueryParams) {
  return msgQueue.add(async () => resolveDb(params).chatMessage.bulkDelete(messageIds))
}
export async function deleteAllMessages(topicId: string, params?: QueryParams) {
  return msgQueue.add(async () => resolveDb(params).chatMessage.where("topicId").equals(topicId).delete())
}
/**
 * @description delete chat group and all messages
 */
export async function bulkDeleteChatTopic(data: ChatTopic[]) {
  const topicIds = data.map(item => item.id)
  return db.transaction("rw", [db.chatMessage, db.chatTopic, db.chatLLMConfig, db.chatTTIConfig], async trans => {
    return Dexie.Promise.all([
      trans.chatTopic.bulkDelete(topicIds),
      trans.chatMessage.where("topicId").anyOf(topicIds).delete(),
      trans.chatLLMConfig.where("topicId").anyOf(topicIds).delete(),
      trans.chatTTIConfig.where("topicId").anyOf(topicIds).delete(),
    ])
  })
}
/**
 * get a message that has the max value of `index` field in `topicId`
 */
export async function getMaxIndexMessage(topicId: string) {
  return msgQueue.add(async () =>
    db.chatMessage.where("[topicId+index]").between([topicId, 0], [topicId, Dexie.maxKey]).last()
  )
}
/**
 * get a node with the maximum index value among the nodes belonging to the `parentId`.
 */
export async function getMaxIndexTopic(parentId?: string | null) {
  return topicQueue.add(async () =>
    db.chatTopic.where("[parentId+index]").between([parentId, 0], [parentId, Dexie.maxKey]).last()
  )
}
/**
 * get messages by `fromId`, which response to the same question
 */
export async function getMessagesByFromId(topicId: string, fromId: string) {
  return msgQueue.add(async () =>
    db.chatMessage
      .where("topicId")
      .equals(topicId)
      .and(m => m.fromId === fromId)
      .toArray()
  )
}
export async function fetch() {
  return topicQueue.add(async () => db.chatTopic.toCollection().sortBy("index"))
}
