import { ChatMessage } from "@windflow/core/types"
import { storage, withTransaction } from "@windflow/core/storage"
export class ChatMessageManager {
  async addMessages(messages: ChatMessage[]) {
    return withTransaction("rw", ["chatTopic"], async t => {
      const messagesByTopic = messages.reduce<Record<string, ChatMessage[]>>((acc, message) => {
        if (!acc[message.topicId]) {
          acc[message.topicId] = []
        }
        acc[message.topicId].push(message)
        return acc
      }, {})
      const topicIds = Object.keys(messagesByTopic)
      const maxIndices = await Promise.all(
        topicIds.map(async topicId => {
          return storage.chat.getMaxIndexMessage(topicId, { transaction: t })
        })
      )
      const indexMap = new Map(maxIndices.filter(v => !!v).map(({ topicId, index }) => [topicId, index]))
      const allMessagesToInsert: ChatMessage[] = []
      for (const [topicId, topicMessages] of Object.entries(messagesByTopic)) {
        const maxIndex = indexMap.get(topicId) ?? -1
        const messagesWithIndex = topicMessages.map((message, i) => ({ ...message, index: maxIndex + i + 1 }))
        allMessagesToInsert.push(...messagesWithIndex)
      }
      await storage.chat.bulkAddChatMessage(allMessagesToInsert, { transaction: t })
    })
  }
  /**
   * get last contexts
   */
  getMessageContexts() {}
  async putChatMessage(message: ChatMessage) {
    return storage.chat.putChatMessage(message)
  }
}
