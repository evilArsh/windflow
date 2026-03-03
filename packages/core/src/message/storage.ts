import { ChatLLMConfig, ChatMessage, ChatTopic, ChatTTIConfig, Media } from "@windflow/core/types"
import { storage, withTransaction } from "@windflow/core/storage"
import { isArrayLength, isUndefined } from "@toolmain/shared"
import { MessageManager } from "./index"
const MessageIndexStep = 100

export class MessageStorage {
  #msgMgr: MessageManager | undefined
  constructor(msgMgr?: MessageManager) {
    this.#msgMgr = msgMgr
  }
  /**
   * add new messages.
   * the values of `index` fields of `messages` will be sequentially incremented to the maximum value within each `topicId` group.
   */
  async addNewMessages(messages: ChatMessage[]) {
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
    return storage.chat.bulkAddChatMessage(allMessagesToInsert)
  }
  /**
   * insert new messages after `current` message, `messages` must have the same `topicId` as `current`
   */
  async insertNewMessages(current: ChatMessage, messages: ChatMessage[]) {
    if (messages.some(m => m.topicId !== current.topicId)) {
      throw new Error("all messages must have the same topicId as current")
    }
    const currentIndex = current.index ?? 0
    messages.forEach((message, i) => {
      message.index = currentIndex + i + 1
    })
    return storage.chat.bulkAddChatMessage(messages)
  }
  async removeMessages(messages: ChatMessage[]) {
    if (isArrayLength(messages)) {
      return storage.chat.bulkDeleteChatMessage(messages.map(m => m.id))
    }
  }
  /**
   * add a new topic, `index` value will be automatically modified
   */
  async addChatTopic(topic: ChatTopic): Promise<ChatTopic> {
    const m = await storage.chat.getMaxIndexTopic(topic.parentId)
    topic.index = m ? m.index + 1 : 0
    await storage.chat.addChatTopic(topic)
    return topic
  }
  async getChatMessages(topicId: string) {
    return storage.chat.getChatMessages(topicId)
  }
  async getChatTTIConfig(topicId: string) {
    return storage.chat.getChatTTIConfig(topicId)
  }
  async addChatTTIConfig(data: ChatTTIConfig) {
    return storage.chat.addChatTTIConfig(data)
  }
  async getChatLLMConfig(topicId: string) {
    return storage.chat.getChatLLMConfig(topicId)
  }
  async addChatLLMConfig(data: ChatLLMConfig) {
    return storage.chat.addChatLLMConfig(data)
  }
  async deleteAllMessages(topicId: string) {
    return storage.chat.deleteAllMessages(topicId)
  }
  async bulkPutChatTopic(datas: ChatTopic[]) {
    return storage.chat.bulkPutChatTopic(datas)
  }
  async putChatTopic(data: ChatTopic) {
    return storage.chat.putChatTopic(data)
  }
  async putChatMessage(data: ChatMessage) {
    return storage.chat.putChatMessage(data)
  }
  async putChatLLMConfig(data: ChatLLMConfig) {
    return storage.chat.putChatLLMConfig(data)
  }
  async putChatTTIConfig(data: ChatTTIConfig) {
    return storage.chat.putChatTTIConfig(data)
  }
  async bulkDeleteChatTopic(data: ChatTopic[]) {
    return storage.chat.bulkDeleteChatTopic(data)
  }
  async bulkAddChatTopics(topics: ChatTopic[]) {
    return storage.chat.bulkAddChatTopics(topics)
  }
  async getTopic(topicId: string) {
    return storage.chat.getTopic(topicId)
  }
  async addChatTempFiles(topicId: string, files: Media[]): Promise<string[] | undefined> {
    const topic = await withTransaction("readwrite", ["chatTopic", "media"], async tx => {
      const topic = await storage.chat.getTopic(topicId, { transaction: tx, disableQueue: true })
      if (!topic) return
      await storage.media.bulkAdd(files, { transaction: tx, disableQueue: true })
      if (!topic.mediaIds) topic.mediaIds = []
      topic.mediaIds.push(...files.map(file => file.id))
      await storage.chat.putChatTopic(topic, { transaction: tx, disableQueue: true })
      return topic
    })
    if (!topic) return
    this.#msgMgr?.emitTopic(topic)
    return topic.mediaIds
  }
  async removeChatTempFile(topicId: string, fileIds: string[]): Promise<string[] | undefined> {
    const topic = await withTransaction("readwrite", ["chatTopic", "media"], async tx => {
      const topic = await storage.chat.getTopic(topicId, { transaction: tx, disableQueue: true })
      if (!topic) return
      const available = fileIds.reduce<string[]>((prev, cur) => {
        if (topic.mediaIds?.includes(cur) && !prev.includes(cur)) {
          prev.push(cur)
        }
        return prev
      }, [])
      if (available.length) {
        await storage.media.bulkRemove(available, { transaction: tx, disableQueue: true })
        topic.mediaIds = topic.mediaIds?.filter(id => !available.includes(id))
        await storage.chat.putChatTopic(topic, { transaction: tx, disableQueue: true })
        return topic
      }
    })
    if (!topic) return
    this.#msgMgr?.emitTopic(topic)
    return topic.mediaIds
  }
  async addMessageFiles(messageId: string, files: Media[]): Promise<string[] | undefined> {
    const message = await withTransaction("readwrite", ["chatMessage", "media"], async tx => {
      const message = await storage.chat.getChatMessage(messageId, { transaction: tx, disableQueue: true })
      if (!message) return
      await storage.media.bulkAdd(files, { transaction: tx, disableQueue: true })
      if (!message.mediaIds) {
        message.mediaIds = []
      }
      message.mediaIds.push(...files.map(file => file.id))
      await storage.chat.putChatMessage(message, { transaction: tx, disableQueue: true })
      return message
    })
    if (!message) return
    this.#msgMgr?.emitMessage(message)
    return message.mediaIds
  }
  async removeMessageFiles(messageId: string, fileIds: string[]): Promise<string[] | undefined> {
    const message = await withTransaction("readwrite", ["chatMessage", "media"], async tx => {
      const message = await storage.chat.getChatMessage(messageId, { transaction: tx, disableQueue: true })
      if (!message) return
      const available = fileIds.reduce<string[]>((prev, cur) => {
        if (message.mediaIds?.includes(cur) && !prev.includes(cur)) {
          prev.push(cur)
        }
        return prev
      }, [])
      if (available.length) {
        await storage.media.bulkRemove(available, { transaction: tx, disableQueue: true })
        message.mediaIds = message.mediaIds?.filter(id => !available.includes(id))
        await storage.chat.putChatMessage(message, { transaction: tx, disableQueue: true })
        return message
      }
    })
    if (!message) return
    this.#msgMgr?.emitMessage(message)
    return message.mediaIds
  }
  async fetch() {
    return storage.chat.fetch()
  }
}
