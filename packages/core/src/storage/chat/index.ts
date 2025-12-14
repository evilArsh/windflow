import {
  ChatLLMConfig,
  ChatMessage,
  ChatMessageTree,
  ChatTopic,
  ChatTopicTree,
  ChatTTIConfig,
  QueryParams,
} from "@windflow/core/types"
import { db } from "../index"
import PQueue from "p-queue"
import { chatTopicDefault } from "../presets/chat"
import { cloneDeep } from "@toolmain/shared"
import { resolveDb } from "../utils"
import { assembleMessageTree, assembleTopicTree } from "./utils"
import Dexie from "dexie"

const topicQueue = new PQueue({ concurrency: 1 })
const msgQueue = new PQueue({ concurrency: 1 })
const configQueue = new PQueue({ concurrency: 1 })
export async function addChatTopic(data: ChatTopic, params?: QueryParams) {
  return topicQueue.add(async () => resolveDb(params).chatTopic.add(cloneDeep(data)))
}
export async function putChatTopic(data: ChatTopic, params?: QueryParams) {
  return topicQueue.add(async () => resolveDb(params).chatTopic.put(cloneDeep(data)))
}
export async function getTopic(topicId: string, params?: QueryParams) {
  return topicQueue.add(async () => resolveDb(params).chatTopic.get(topicId))
}
export async function addChatLLMConfig(data: ChatLLMConfig, params?: QueryParams) {
  return configQueue.add(async () => resolveDb(params).chatLLMConfig.add(cloneDeep(data)))
}
export async function getChatLLMConfig(topicId: string, params?: QueryParams) {
  return configQueue.add(async () => resolveDb(params).chatLLMConfig.where("topicId").equals(topicId).first())
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
export async function getChatTTIConfig(topicId: string, params?: QueryParams) {
  return configQueue.add(async () => resolveDb(params).chatTTIConfig.where("topicId").equals(topicId).first())
}

export async function addChatMessage(data: ChatMessage, params?: QueryParams) {
  return msgQueue.add(async () => resolveDb(params).chatMessage.add(cloneDeep(data)))
}
export async function putChatMessage(data: ChatMessage, params?: QueryParams) {
  return msgQueue.add(async () => resolveDb(params).chatMessage.put(cloneDeep(data)))
}
export async function bulkPutChatMessage(data: ChatMessage[], params?: QueryParams) {
  return msgQueue.add(async () => resolveDb(params).chatMessage.bulkPut(cloneDeep(data)))
}
export async function bulkAddChatMessage(data: ChatMessage[], params?: QueryParams) {
  return msgQueue.add(async () => resolveDb(params).chatMessage.bulkAdd(cloneDeep(data)))
}
/**
 * @description get all messages of a topic
 */
export async function getChatMessage(topicId: string, params?: QueryParams) {
  const messageList: ChatMessageTree[] = []

  const res = (
    await msgQueue.add(async () => resolveDb(params).chatMessage.where("topicId").equals(topicId).sortBy("index"))
  ).reverse()
  messageList.push(
    ...assembleMessageTree(res, item => {
      item.node.finish = true
      item.node.status = 200
    })
  )
  return messageList
}
/**
 * get a message that has the max value of `index` field in `topicId`
 */
export async function getMaxIndexMessage(topicId: string, params?: QueryParams) {
  return msgQueue.add(async () =>
    resolveDb(params).chatMessage.where("[topicId+index]").between([topicId, 0], [topicId, Dexie.maxKey]).last()
  )
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
export async function delChatTopic(data: ChatTopic[]) {
  const topicIds = data.map(item => item.id)
  return db.transaction("rw", [db.chatMessage, db.chatTopic, db.chatLLMConfig, db.chatTTIConfig], async trans => {
    await topicQueue.add(async () => trans.chatTopic.bulkDelete(topicIds))
    await msgQueue.add(async () => trans.chatMessage.where("topicId").anyOf(topicIds).delete())
    await configQueue.add(async () => trans.chatLLMConfig.where("topicId").anyOf(topicIds).delete())
    await configQueue.add(async () => trans.chatTTIConfig.where("topicId").anyOf(topicIds).delete())
  })
}
export async function fetch(params?: QueryParams) {
  const topicList: ChatTopicTree[] = []

  const data = await topicQueue.add(async () => resolveDb(params).chatTopic.toCollection().sortBy("index"))
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
