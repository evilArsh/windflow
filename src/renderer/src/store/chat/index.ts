import { defineStore } from "pinia"
import { ChatLLMConfig, ChatMessage, ChatTopic, ChatTopicTree, ChatTTIConfig } from "@renderer/types"
import useModelsStore from "@renderer/store/model"
import { useData } from "./api"
import { useUtils } from "./utils"
import { defaultTTIConfig, defaultLLMConfig } from "./default"
import { uniqueId } from "@toolmain/shared"
import { useMsg } from "./msg"

export default defineStore("chat_topic", () => {
  const modelsStore = useModelsStore()
  const topicList = reactive<Array<ChatTopicTree>>([]) // 聊天组列表
  const chatMessage = reactive<Record<string, ChatMessage[]>>({}) // 聊天信息缓存,topicId作为key
  const chatLLMConfig = reactive<Record<string, ChatLLMConfig>>({}) // 聊天LLM配置,topicId作为key
  const chatTTIConfig = reactive<Record<string, ChatTTIConfig>>({}) // 聊天图片配置,topicId作为key
  const api = useData()
  const utils = useUtils(chatMessage, chatLLMConfig, chatTTIConfig)
  const msgModule = useMsg(chatMessage, chatLLMConfig, chatTTIConfig)

  /**
   * @description 刷新topic的可用models
   */
  function refreshChatTopicModelIds(topic: ChatTopic) {
    // 刷新models
    const modelsIds = topic.modelIds
    topic.modelIds = modelsIds.reduce((acc, cur) => {
      const model = modelsStore.find(cur)
      if (model && model.active) {
        acc.push(model.id)
      }
      return acc
    }, [] as string[])
  }

  /**
   * 向 `topicList` 缓存列表末尾加入一个节点
   */
  function cachePushChatTopicTree(treeData: ChatTopicTree, index?: number) {
    topicList.splice(index ?? topicList.length, 0, treeData)
  }

  /**
   * @description 删除一条消息列表的消息
   */
  async function deleteMessage(topic: ChatTopic, messageId: string, parentMessageId?: string) {
    const messages = utils.findChatMessage(topic.id)
    if (!messages) return
    msgModule.terminate(topic, messageId, parentMessageId)
    msgModule.removeContext(topic.id, messageId)
    const [message, index] = utils.findChatMessageChild(topic.id, messageId, parentMessageId)
    if (!message) {
      console.warn(
        "[deleteMessage]",
        `cannot find child messageDataId: ${messageId} in parent messageDataId: ${parentMessageId}`
      )
      return
    }
    if (parentMessageId) {
      const [parentMessage, parentIndex] = utils.findChatMessageChild(topic.id, parentMessageId)
      if (!parentMessage) return
      parentMessage.children?.splice(index, 1)
      if (!parentMessage.children?.length) {
        messages.splice(parentIndex, 1)
        await api.deleteChatMessage(parentMessageId)
      } else {
        await api.putChatMessage(parentMessage)
      }
    } else {
      messages.splice(index, 1)
      await api.deleteChatMessage(messageId)
    }
  }
  /**
   * @description 加载topic的chatMessage,chatLLMConfig,chatTTIConfig数据
   */
  async function loadChatTopicData(topic: ChatTopic) {
    const messages = utils.findChatMessage(topic.id)
    if (!messages) {
      const messagesData = await api.getChatMessage(topic.id)
      chatMessage[topic.id] = messagesData
    }
    if (!utils.findChatTTIConfig(topic.id)) {
      let cnf = await api.getChatTTIConfig(topic.id)
      if (!cnf) {
        cnf = Object.assign(defaultTTIConfig(), { id: uniqueId(), topicId: topic.id })
        await api.addChatTTIConfig(cnf)
      }
      chatTTIConfig[topic.id] = cnf
    }
    if (!utils.findChatLLMConfig(topic.id)) {
      let cnf = await api.getChatLLMConfig(topic.id)
      if (!cnf) {
        cnf = Object.assign(defaultLLMConfig(), { id: uniqueId(), topicId: topic.id })
        await api.addChatLLMConfig(cnf)
      }
      chatLLMConfig[topic.id] = cnf
    }
  }
  async function updateChatTopic(topic: ChatTopic) {
    return api.putChatTopic(topic)
  }
  async function updateChatMessage(msg: ChatMessage) {
    return api.putChatMessage(msg)
  }
  /**
   * @param index 插入到缓存中的位置
   */
  async function addChatMessage(msg: ChatMessage, index?: number) {
    await api.addChatMessage(msg)
    chatMessage[msg.topicId].splice(index ?? chatMessage[msg.topicId].length, 0, msg)
  }
  async function updateChatLLMConfig(cnf: ChatLLMConfig) {
    return api.updateChatLLMConfig(cnf)
  }
  async function updateChatTTIConfig(cnf: ChatTTIConfig) {
    return api.updateChatTTIConfig(cnf)
  }
  async function removeChatTopic(nodes: ChatTopic[]) {
    return api.delChatTopic(nodes)
  }
  /**
   * 数据库中添加一个新的 `topic`
   * @param append 是否添加到 `topicList` 缓存列表末尾
   */
  async function addChatTopic(topic: ChatTopic, append?: boolean): Promise<ChatTopicTree> {
    await api.addChatTopic(topic)
    const treeNode = utils.topicToTree(topic)
    if (append) {
      topicList.push(treeNode)
    }
    return treeNode
  }
  /**
   * 删除 `topicId` 下的消息列表
   */
  function cacheRemoveChatMessage(topicId: string) {
    if (Object.hasOwn(chatMessage, topicId)) {
      delete chatMessage[topicId]
    }
  }
  /**
   * 程序启动时初始化加载聊天数据
   */
  async function init() {
    topicList.length = 0
    const res = await api.fetch()
    topicList.push(...res)
  }
  return {
    init,

    topicList,
    chatMessage,
    chatTTIConfig,
    chatLLMConfig,
    terminate: msgModule.terminate,
    restart: msgModule.restart,
    send: msgModule.send,
    terminateAll: msgModule.terminateAll,
    cachePushChatTopicTree,
    deleteMessage,
    refreshChatTopicModelIds,
    loadChatTopicData,
    updateChatTopic,
    updateChatMessage,
    addChatMessage,
    updateChatLLMConfig,
    updateChatTTIConfig,
    removeChatTopic,
    addChatTopic,
    cacheRemoveChatMessage,
    utils,
  }
})
