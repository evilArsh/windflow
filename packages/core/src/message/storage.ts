import { ChatMessage, ChatTopic } from "@windflow/core/types"
import { storage } from "@windflow/core/storage"
import { isArrayLength, isUndefined } from "@toolmain/shared"
const MessageIndexStep = 100

/**
 * save messages to database, besides set `index` of each message
 */
export async function saveNewMessages(messages: ChatMessage[]): Promise<void> {
  const messagesByTopic = messages.reduce<Record<string, ChatMessage[]>>((acc, message) => {
    if (!acc[message.topicId]) {
      acc[message.topicId] = []
    }
    acc[message.topicId].push(message)
    return acc
  }, {})

  // get max index of messages in each topic
  const topicIds = Object.keys(messagesByTopic)
  const maxIndices = await Promise.all(
    topicIds.map(async topicId => {
      return storage.chat.getMaxIndexMessage(topicId)
    })
  )
  const indexMap = new Map(maxIndices.filter(v => !isUndefined(v)).map(({ topicId, index }) => [topicId, index]))

  const allMessagesToInsert: ChatMessage[] = []
  for (const [topicId, topicMessages] of Object.entries(messagesByTopic)) {
    const maxIndex = indexMap.get(topicId) ?? 0
    topicMessages.forEach((message, i) => {
      message.index = maxIndex + MessageIndexStep * (i + 1)
    })
    allMessagesToInsert.push(...topicMessages)
  }
  await storage.chat.bulkAddChatMessage(allMessagesToInsert)
}
/**
 * insert new messages after `current` message, `messages` must have the same `topicId` as `current`
 */
export async function insertNewMessages(current: ChatMessage, messages: ChatMessage[]): Promise<void> {
  const currentIndex = current.index ?? 0
  messages.forEach((message, i) => {
    message.index = currentIndex + i + 1
  })
  await storage.chat.bulkAddChatMessage(messages)
}
export async function deleteMessages(messages: ChatMessage[]) {
  if (isArrayLength(messages)) {
    return storage.chat.bulkDeleteChatMessage(messages.map(m => m.id))
  }
}
export async function addChatTopic(topic: ChatTopic): Promise<ChatTopic> {
  const m = await storage.chat.getMaxIndexTopic(topic.parentId)
  topic.index = m ? m.index + 1 : 0
  await storage.chat.addChatTopic(topic)
  return topic
}
