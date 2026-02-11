import { defineStore } from "pinia"
import {
  ChatEventResponse,
  ChatLLMConfig,
  ChatMessage,
  ChatMessageTree,
  ChatTopic,
  ChatTopicTree,
  ChatTTIConfig,
  Content,
  Role,
} from "@windflow/core/types"
import useModelsStore from "@renderer/store/model"
import { defaultTTIConfig, defaultLLMConfig, chatTopicDefault } from "@windflow/core/storage"
import { cloneDeep, code1xx, code2xx, isArray, uniqueId } from "@toolmain/shared"
import {
  assembleMessageTree,
  assembleTopicTree,
  findChatLLMConfig,
  findChatMessage,
  findChatTTIConfig,
  getIndex,
  removeMessage,
  topicToTree,
  unwrapMessage,
  VirtualNodeIdPrefix,
  wrapMessage,
} from "./utils"
import { useMessage } from "@renderer/hooks/useCore"
import { AllTopicsFlag, createChatMessage } from "@windflow/core/message"

export default defineStore("chat_topic", () => {
  const modelsStore = useModelsStore()

  const topicList = reactive<Array<ChatTopicTree>>([]) // all chat lists
  const topicMap = new Map<string, ChatTopicTree>()

  const chatMessage = reactive<Record<string, ChatMessageTree[]>>({}) // all chat messages group by `topicId`
  const chatMessageMap = new Map<string, ChatMessageTree>()

  const chatLLMConfig = reactive<Record<string, ChatLLMConfig>>({}) // 聊天LLM配置,topicId作为key
  const chatTTIConfig = reactive<Record<string, ChatTTIConfig>>({}) // 聊天图片配置,topicId作为key
  const msgMgr = useMessage()
  const chatStorage = msgMgr.getStorage()
  const { t } = useI18n()
  function onMessageReceived(e: ChatEventResponse) {
    if (e.topic) {
      const current = topicMap.get(e.topic.id)
      if (current) {
        current.node.label = e.topic.label
      }
    }
    const message = e.message
    if (!message) return
    const topic = topicMap.get(message.topicId)
    if (!topic) return
    const contextId = e.contextId
    let cacheMsg = chatMessageMap.get(message.id)
    if (!cacheMsg) {
      topic.node.requestCount = Math.max(1, topic.node.requestCount + 1)
      cacheMsg = reactive(wrapMessage(cloneDeep(message)))
      chatMessageMap.set(cacheMsg.id, cacheMsg)
      if (!chatMessage[message.topicId]) chatMessage[message.topicId] = []
      if (message.fromId) {
        const fromNode = chatMessageMap.get(message.fromId)
        // from node does not exist, just append to end
        if (!fromNode) {
          chatMessage[message.topicId].unshift(cacheMsg)
        } else {
          // multiple models request
          if (isArray(fromNode.node.type)) {
            const vId = `${VirtualNodeIdPrefix}${message.fromId}`
            let vNode = chatMessageMap.get(vId)
            if (vNode) {
              vNode.children.push(cacheMsg)
            } else {
              vNode = reactive(
                wrapMessage(
                  createChatMessage({
                    topicId: message.topicId,
                    id: vId,
                  })
                )
              )
              chatMessage[message.topicId].unshift(vNode)
              chatMessageMap.set(vId, vNode)
              vNode.children.push(cacheMsg)
            }
          } else {
            const fromIndex = getIndex(topic.id, fromNode.id, chatMessage)
            if (fromIndex > -1) {
              chatMessage[message.topicId].splice(fromIndex, 0, cacheMsg)
            } else {
              chatMessage[message.topicId].unshift(cacheMsg)
            }
          }
        }
      } else {
        chatMessage[message.topicId].unshift(cacheMsg)
      }
    } else {
      Object.assign(cacheMsg.node, message)
    }
    if (code1xx(message.status)) {
      cacheMsg.node.finish = false
    } else if (message.status == 206) {
      cacheMsg.node.finish = false
    } else {
      topic.node.requestCount = Math.max(0, topic.node.requestCount - 1)
      cacheMsg.node.finish = true
      if (code2xx(message.status)) {
        // auto summarize a topic title
        if (contextId && topic.node.label === window.defaultTopicTitle) {
          msgMgr.summarize(contextId)
        }
      }
    }
  }
  async function terminateAll(topicId: string, destroy?: boolean) {
    return msgMgr.terminateAll(topicId, destroy)
  }
  async function terminate(messageId: string, destroy?: boolean) {
    const wrapMsg = chatMessageMap.get(messageId)
    if (!wrapMsg) return
    const msg = unwrapMessage(wrapMsg)
    await Promise.all([
      msgMgr.terminate(msg.topicId, msg.id, destroy),
      ...wrapMsg.children.map(m => {
        const childM = unwrapMessage(m)
        return msgMgr.terminate(childM.topicId, childM.id, destroy)
      }),
    ])
  }
  async function restart(messageId: string): Promise<void> {
    const wrapMsg = chatMessageMap.get(messageId)
    if (!wrapMsg) return
    const msg = unwrapMessage(wrapMsg)
    await Promise.all([
      msgMgr.terminate(msg.topicId, msg.id),
      ...wrapMsg.children.map(m => {
        const childM = unwrapMessage(m)
        return msgMgr.restart(childM.topicId, childM.id)
      }),
    ])
    if (msg.id.startsWith(VirtualNodeIdPrefix)) {
      await Promise.all(
        wrapMsg.children.map(m => {
          const childM = unwrapMessage(m)
          return msgMgr.restart(childM.topicId, childM.id)
        })
      )
    } else {
      await msgMgr.restart(msg.topicId, msg.id)
    }
  }
  function send(topicId: string, content: Content, modelIds: string[]) {
    if (!modelIds.length) {
      throw new Error(t("error.emptyModels"))
    }
    return msgMgr.send(topicId, content, modelIds)
  }
  /**
   * @description 加载topic的chatMessage,chatLLMConfig,chatTTIConfig数据
   */
  async function loadChatTopicData(topic: ChatTopic) {
    const messages = findChatMessage(topic.id, chatMessage)
    if (!messages) {
      const messagesData = await chatStorage.getChatMessages(topic.id)
      chatMessage[topic.id] = assembleMessageTree(messagesData, message => {
        const m = reactive<ChatMessageTree>(wrapMessage(message))
        m.node.finish = true
        m.node.status = 200
        m.node.content.children?.forEach(message => {
          if (!message.tool_calls_chain) {
            message.tool_calls_chain = message.tool_calls?.map(c => {
              return { content: "", tool_call_id: c.id, role: Role.Tool }
            })
          }
        })
        chatMessageMap.set(message.id, m)
        return m
      })
    }
    if (!findChatTTIConfig(topic.id, chatTTIConfig)) {
      let cnf = await chatStorage.getChatTTIConfig(topic.id)
      if (!cnf) {
        cnf = Object.assign(defaultTTIConfig(), { id: uniqueId(), topicId: topic.id })
        await chatStorage.addChatTTIConfig(cnf)
      }
      chatTTIConfig[topic.id] = cnf
    }
    if (!findChatLLMConfig(topic.id, chatLLMConfig)) {
      let cnf = await chatStorage.getChatLLMConfig(topic.id)
      if (!cnf) {
        cnf = Object.assign(defaultLLMConfig(), { id: uniqueId(), topicId: topic.id })
        await chatStorage.addChatLLMConfig(cnf)
      }
      chatLLMConfig[topic.id] = cnf
    }
  }
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
   * @description 删除一条消息列表的消息
   */
  async function deleteMessage(message: ChatMessageTree) {
    const all = [...message.children]
    if (!unwrapMessage(message).id.startsWith(VirtualNodeIdPrefix)) {
      all.push(message)
    }
    await Promise.all(
      all.map(m => {
        const msg = unwrapMessage(m)
        return msgMgr.terminate(msg.topicId, msg.id, true)
      })
    )
    await chatStorage.removeMessages(all.map(unwrapMessage))
    removeMessage(message, chatMessage)
    all.forEach(m => {
      chatMessageMap.delete(m.id)
    })
    chatMessageMap.delete(message.id)
  }
  async function deleteAllMessage(topic: ChatTopic) {
    const msgs: ChatMessageTree[] = []
    const recursiveScan = (node: ChatMessageTree) => {
      msgs.push(node)
      chatMessageMap.delete(node.id)
      node.children.forEach(recursiveScan)
    }
    findChatMessage(topic.id, chatMessage)
      ?.filter(m => unwrapMessage(m).topicId === topic.id)
      .forEach(recursiveScan)
    await Promise.all(
      msgs.map(msgTree => {
        const msg = unwrapMessage(msgTree)
        return msgMgr.terminate(msg.topicId, msg.id, true)
      })
    )
    await chatStorage.deleteAllMessages(topic.id)
    if (chatMessage[topic.id]) {
      chatMessage[topic.id].length = 0
    }
  }
  async function bulkPutChatTopic(topics: ChatTopic[]) {
    return chatStorage.bulkPutChatTopic(topics)
  }
  async function updateChatTopic(topic: ChatTopic) {
    return chatStorage.putChatTopic(topic)
  }
  async function updateChatMessage(msg: ChatMessage) {
    return chatStorage.putChatMessage(msg)
  }
  /**
   * 数据库中添加一个新的 `topic`
   * @param append 是否添加到 `topicList` 缓存列表末尾
   */
  async function addChatTopic(topic: ChatTopic, append?: boolean): Promise<ChatTopicTree> {
    await chatStorage.addChatTopic(topic)
    const treeNode = reactive(topicToTree(topic))
    topicMap.set(treeNode.id, treeNode)
    if (append) {
      topicList.push(treeNode)
    }
    return treeNode
  }
  /**
   * 向 `topicList` 缓存列表末尾加入一个节点
   */
  function cachePushChatTopicTree(treeData: ChatTopicTree, index?: number) {
    const treeNode = reactive(treeData)
    topicMap.set(treeNode.id, treeNode)
    topicList.splice(index ?? topicList.length, 0, treeData)
  }
  /**
   * add a new message to database and modify the `index` value to the maximum value in current `topicId`
   * @param index postion that inserts to cache array, not database
   */
  async function addChatMessage(msg: ChatMessage, index?: number) {
    await chatStorage.addNewMessages([msg])
    const msgNode = reactive(wrapMessage(msg))
    chatMessageMap.set(msgNode.id, msgNode)
    chatMessage[msg.topicId].splice(index ?? 0, 0, msgNode)
  }
  async function updateChatLLMConfig(cnf: ChatLLMConfig) {
    chatStorage.putChatLLMConfig(cnf)
    chatLLMConfig[cnf.topicId] = cnf
  }
  async function updateChatTTIConfig(cnf: ChatTTIConfig) {
    chatStorage.putChatTTIConfig(cnf)
    chatTTIConfig[cnf.topicId] = cnf
  }
  async function removeChatTopic(nodes: ChatTopic[]) {
    await chatStorage.bulkDeleteChatTopic(nodes)
    nodes.forEach(node => {
      topicMap.delete(node.id)
      delete chatLLMConfig[node.id]
      delete chatTTIConfig[node.id]
    })
  }
  /**
   * 删除 `topicId` 下的消息列表
   */
  function cacheRemoveChatMessage(topicId: string) {
    const messages = chatMessage[topicId]
    if (messages) {
      messages.forEach(m => {
        chatMessageMap.delete(m.id)
        if (m.id.startsWith(VirtualNodeIdPrefix)) {
          m.children.forEach(m => {
            chatMessageMap.delete(m.id)
          })
        }
      })
    }
    delete chatMessage[topicId]
  }

  /**
   * initially load chat data from the database and listen message event
   */
  async function init() {
    topicList.length = 0
    topicMap.clear()
    const data = (await chatStorage.fetch()).filter(n => !n.isVirtual)
    const defaultData = chatTopicDefault()
    const newDefault: ChatTopic[] = []
    for (const item of defaultData) {
      if (!data.find(v => v.id === item.id)) {
        newDefault.push(item)
      }
    }
    if (newDefault.length) {
      data.push(...newDefault)
      await chatStorage.bulkAddChatTopics(newDefault)
    }
    topicList.push(
      ...assembleTopicTree(data, item => {
        const tree: ChatTopicTree = reactive({ id: item.id, node: item, children: [] })
        tree.node.requestCount = 0
        topicMap.set(tree.node.id, tree)
        return tree
      })
    )
    msgMgr.on(AllTopicsFlag, onMessageReceived)
  }
  onBeforeUnmount(() => {
    msgMgr.off(AllTopicsFlag, onMessageReceived)
  })
  return {
    init,
    topicList,
    chatMessage,
    chatTTIConfig,
    chatLLMConfig,
    terminateAll,
    terminate,
    restart,
    send,
    cachePushChatTopicTree,
    deleteMessage,
    deleteAllMessage,
    refreshChatTopicModelIds,
    loadChatTopicData,
    bulkPutChatTopic,
    updateChatTopic,
    updateChatMessage,
    addChatMessage,
    updateChatLLMConfig,
    updateChatTTIConfig,
    removeChatTopic,
    addChatTopic,
    cacheRemoveChatMessage,
  }
})
