import { ChatLLMConfig, ChatMessage, ChatTopic, ChatTTIConfig, QueryParams } from "@windflow/core/types"
import { useDBQueue, withTransaction } from "@windflow/core/storage"
import { cloneDeep, isUndefined } from "@toolmain/shared"
import Dexie from "dexie"

const topicQueue = useDBQueue()
const msgQueue = useDBQueue()
const configQueue = useDBQueue()
export async function addChatTopic(data: ChatTopic, params?: QueryParams) {
  return topicQueue.add(db => db.chatTopic.add(cloneDeep(data)), params)
}
export async function bulkAddChatTopics(datas: ChatTopic[], params?: QueryParams) {
  return topicQueue.add(db => db.chatTopic.bulkAdd(cloneDeep(datas)), params)
}
export async function putChatTopic(data: ChatTopic, params?: QueryParams) {
  return topicQueue.add(db => db.chatTopic.put(cloneDeep(data)), params)
}
export async function bulkPutChatTopic(datas: ChatTopic[], params?: QueryParams) {
  return topicQueue.add(db => db.chatTopic.bulkPut(cloneDeep(datas)), params)
}
export async function getTopic(topicId: string, params?: QueryParams) {
  return topicQueue.add(db => db.chatTopic.get(topicId), params)
}
export async function addChatLLMConfig(data: ChatLLMConfig, params?: QueryParams) {
  return configQueue.add(db => db.chatLLMConfig.add(cloneDeep(data)), params)
}
export async function getChatLLMConfig(topicId: string, params?: QueryParams) {
  return configQueue.add(db => db.chatLLMConfig.where("topicId").equals(topicId).first(), params)
}
export async function putChatLLMConfig(data: ChatLLMConfig, params?: QueryParams) {
  return configQueue.add(db => db.chatLLMConfig.put(cloneDeep(data)), params)
}

export async function addChatTTIConfig(data: ChatTTIConfig, params?: QueryParams) {
  return configQueue.add(db => db.chatTTIConfig.add(cloneDeep(data)), params)
}
export async function putChatTTIConfig(data: ChatTTIConfig, params?: QueryParams) {
  return configQueue.add(db => db.chatTTIConfig.put(cloneDeep(data)), params)
}
export async function getChatTTIConfig(topicId: string, params?: QueryParams) {
  return configQueue.add(db => db.chatTTIConfig.where("topicId").equals(topicId).first(), params)
}

export async function addChatMessage(data: ChatMessage, params?: QueryParams) {
  return msgQueue.add(db => db.chatMessage.add(cloneDeep(data)), params)
}
export async function putChatMessage(data: ChatMessage, params?: QueryParams) {
  return msgQueue.add(db => db.chatMessage.put(cloneDeep(data)), params)
}
export async function updateChatMessage(id: string, data: Partial<ChatMessage>, params?: QueryParams) {
  const cdata = cloneDeep(data)
  delete cdata.id
  return msgQueue.add(db => db.chatMessage.update(id, cdata), params)
}
export async function bulkPutChatMessage(data: ChatMessage[], params?: QueryParams) {
  return msgQueue.add(db => db.chatMessage.bulkPut(cloneDeep(data)), params)
}
export async function bulkAddChatMessage(data: ChatMessage[], params?: QueryParams) {
  return msgQueue.add(db => db.chatMessage.bulkAdd(cloneDeep(data)), params)
}
/**
 * @description get all messages of a topic and sort by `index`
 */
export async function getChatMessages(topicId: string, params?: QueryParams) {
  return msgQueue.add(db => db.chatMessage.where("topicId").equals(topicId).sortBy("index"), params)
}
/**
 * @description get message by `messageId` in a topic
 */
export async function getChatMessage(messageId: string, params?: QueryParams): Promise<ChatMessage | undefined> {
  return msgQueue.add(db => db.chatMessage.where("id").equals(messageId).first(), params)
}
export async function deleteChatMessage(messageId: string) {
  return withTransaction("rw", ["chatMessage", "media"], async trans => {
    const message = await trans.chatMessage.get(messageId)
    if (!message) return
    const mediaIds = message.mediaIds ?? []
    return Dexie.Promise.all([trans.chatMessage.delete(messageId), trans.media.where("id").anyOf(mediaIds).delete()])
  })
}
export async function bulkDeleteChatMessage(messageIds: string[]) {
  return withTransaction("rw", ["chatMessage", "media"], async trans => {
    const mediaIds = (await trans.chatMessage.bulkGet(messageIds))
      .filter(item => !isUndefined(item))
      .map(item => item.mediaIds)
      .flat()
      .filter(item => !isUndefined(item))
    return Dexie.Promise.all([
      trans.chatMessage.bulkDelete(messageIds),
      trans.media.bulkDelete(messageIds),
      trans.media.where("id").anyOf(mediaIds).delete(),
    ])
  })
}
export async function deleteAllMessages(topicId: string) {
  return withTransaction("rw", ["chatMessage", "media"], async trans => {
    const mediIds = (await trans.chatMessage.where("topicId").equals(topicId).toArray())
      .map(item => item.mediaIds)
      .flat()
      .filter(item => !isUndefined(item))
    return Dexie.Promise.all([
      trans.chatMessage.where("topicId").equals(topicId).delete(),
      trans.media.where("id").anyOf(mediIds).delete(),
    ])
  })
}
/**
 * @description delete chat group and all messages
 */
export async function bulkDeleteChatTopic(data: ChatTopic[]) {
  const topicIds = data.map(item => item.id)
  const mediaIds = data
    .map(item => item.mediaIds)
    .flat()
    .filter(item => !isUndefined(item))
  return withTransaction("rw", ["chatMessage", "chatTopic", "chatLLMConfig", "chatTTIConfig", "media"], async trans => {
    return Dexie.Promise.all([
      trans.chatTopic.bulkDelete(topicIds),
      trans.chatMessage.where("topicId").anyOf(topicIds).delete(),
      trans.chatLLMConfig.where("topicId").anyOf(topicIds).delete(),
      trans.chatTTIConfig.where("topicId").anyOf(topicIds).delete(),
      trans.media.where("id").anyOf(mediaIds).delete(),
    ])
  })
}
/**
 * get a message that has the max value of `index` field in `topicId`
 */
export async function getMaxIndexMessage(topicId: string, params?: QueryParams) {
  return msgQueue.add(
    db => db.chatMessage.where("[topicId+index]").between([topicId, 0], [topicId, Dexie.maxKey]).last(),
    params
  )
}
/**
 * get a node with the maximum index value among the nodes belonging to the `parentId`.
 */
export async function getMaxIndexTopic(parentId?: string | null, params?: QueryParams) {
  return topicQueue.add(
    db => db.chatTopic.where("[parentId+index]").between([parentId, 0], [parentId, Dexie.maxKey]).last(),
    params
  )
}
/**
 * get messages by `fromId`, which response to the same question
 */
export async function getMessagesByFromId(topicId: string, fromId: string, params?: QueryParams) {
  return msgQueue.add(
    db =>
      db.chatMessage
        .where("topicId")
        .equals(topicId)
        .and(m => m.fromId === fromId)
        .toArray(),
    params
  )
}
export async function fetch() {
  return topicQueue.add(db => db.chatTopic.toCollection().sortBy("index"))
}
