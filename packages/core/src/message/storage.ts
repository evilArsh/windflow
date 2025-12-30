import { ChatMessage } from "@windflow/core/types"
import { storage, withTransaction } from "@windflow/core/storage"
import { isUndefined } from "@toolmain/shared"
const MessageIndexStep = 100

/**
 * save messages to database, besides set `index` of each message
 */
export async function saveNewMessages(messages: ChatMessage[]): Promise<void> {
  return withTransaction("rw", ["chatMessage"], async t => {
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
        return storage.chat.getMaxIndexMessage(topicId, { transaction: t })
      })
    )
    const indexMap = new Map(maxIndices.filter(v => !isUndefined(v)).map(({ topicId, index }) => [topicId, index]))

    const allMessagesToInsert: ChatMessage[] = []
    for (const [topicId, topicMessages] of Object.entries(messagesByTopic)) {
      const maxIndex = indexMap.get(topicId) ?? 0
      topicMessages.forEach((message, i) => {
        message.index = maxIndex + MessageIndexStep * (i + 1)
        return message
      })
      allMessagesToInsert.push(...topicMessages)
    }
    await storage.chat.bulkAddChatMessage(allMessagesToInsert, { transaction: t })
  })
}
/**
 * insert new messages after `current` message, `messages` must have the same `topicId` as `current`
 */
export async function insertNewMessages(current: ChatMessage, messages: ChatMessage[]): Promise<void> {
  const currentIndex = current.index ?? 0
  const messagesWithIndex = messages.map((message, i) => ({
    ...message,
    index: currentIndex + i + 1,
  }))
  await storage.chat.bulkAddChatMessage(messagesWithIndex)
}
