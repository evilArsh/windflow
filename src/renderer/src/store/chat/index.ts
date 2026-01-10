import { defineStore } from "pinia"
import {
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
import { storage, defaultTTIConfig, defaultLLMConfig, chatTopicDefault, withTransaction } from "@windflow/core/storage"
import { cloneDeep, code1xx, isArray, isArrayLength, uniqueId } from "@toolmain/shared"
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
import { useMessage } from "@renderer/hooks/useMessage"
import { createChatMessage } from "@windflow/core/message"

export default defineStore("chat_topic", () => {
  const modelsStore = useModelsStore()

  const topicList = reactive<Array<ChatTopicTree>>([]) // all chat lists
  const topicMap = new Map<string, ChatTopicTree>()

  const chatMessage = reactive<Record<string, ChatMessageTree[]>>({}) // all chat messages group by `topicId`
  const chatMessageMap = new Map<string, ChatMessageTree>()

  const chatLLMConfig = reactive<Record<string, ChatLLMConfig>>({}) // 聊天LLM配置,topicId作为key
  const chatTTIConfig = reactive<Record<string, ChatTTIConfig>>({}) // 聊天图片配置,topicId作为key
  const msgMgr = useMessage()
  function _onReceiveMessage(message: ChatMessage, _contextId?: string) {
    const topic = topicMap.get(message.topicId)
    let cacheMsg = chatMessageMap.get(message.id)
    if (!topic) return
    if (!cacheMsg) {
      topic.node.requestCount = Math.max(1, topic.node.requestCount + 1)
      cacheMsg = reactive(wrapMessage(cloneDeep(message)))
      chatMessageMap.set(cacheMsg.id, cacheMsg)
      if (!chatMessage[message.topicId]) chatMessage[message.topicId] = []
      if (message.fromId) {
        const fromNode = chatMessageMap.get(message.fromId)
        // from node does not exist, jut append to end
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
    }
    Object.assign(cacheMsg.node, message)
    if (code1xx(message.status)) {
      cacheMsg.node.finish = false
    } else if (message.status == 206) {
      cacheMsg.node.finish = false
    } else {
      topic.node.requestCount = Math.max(0, topic.node.requestCount - 1)
      cacheMsg.node.finish = true
    }
    // if (message.content.children?.some(child => !!child.reasoning_content)) {
    //   if (!modelsStore.utils.isChatReasonerType(model)) {
    //     model.type.push(ModelType.ChatReasoner)
    //     modelsStore.put(model)
    //   }
    // }
    // if (message.parentId) return // 多模型请求时不总结标题
    // if (topic.label === window.defaultTopicTitle && chatContext.provider) {
    //   chatContext.provider.summarize(JSON.stringify(message), model, providerMeta, value => {
    //     if (isString(value.data.content)) {
    //       topic.label = value.data.content
    //       api.putChatTopic(topic)
    //     }
    //   })
    // }
  }
  function terminateAll(topicId: string, destroy?: boolean) {
    msgMgr.terminateAll(topicId, destroy)
  }
  function terminate(messageId: string, destroy?: boolean) {
    const wrapMsg = chatMessageMap.get(messageId)
    if (!wrapMsg) return
    const msg = unwrapMessage(wrapMsg)
    msgMgr.terminate(msg.topicId, msg.id, destroy)
    wrapMsg.children.forEach(m => {
      const childM = unwrapMessage(m)
      msgMgr.terminate(childM.topicId, childM.id, destroy)
    })
  }
  async function restart(messageId: string): Promise<void> {
    const wrapMsg = chatMessageMap.get(messageId)
    if (!wrapMsg) return
    const msg = unwrapMessage(wrapMsg)
    msgMgr.terminate(msg.topicId, msg.id)
    wrapMsg.children.forEach(m => {
      const childM = unwrapMessage(m)
      msgMgr.terminate(childM.topicId, childM.id)
    })
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
    return msgMgr.send(topicId, content, modelIds)
  }
  /**
   * @description 加载topic的chatMessage,chatLLMConfig,chatTTIConfig数据
   */
  async function loadChatTopicData(topic: ChatTopic) {
    const messages = findChatMessage(topic.id, chatMessage)
    if (!messages) {
      const messagesData = await storage.chat.getChatMessages(topic.id)
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
      let cnf = await storage.chat.getChatTTIConfig(topic.id)
      if (!cnf) {
        cnf = Object.assign(defaultTTIConfig(), { id: uniqueId(), topicId: topic.id })
        await storage.chat.addChatTTIConfig(cnf)
      }
      chatTTIConfig[topic.id] = cnf
    }
    if (!findChatLLMConfig(topic.id, chatLLMConfig)) {
      let cnf = await storage.chat.getChatLLMConfig(topic.id)
      if (!cnf) {
        cnf = Object.assign(defaultLLMConfig(), { id: uniqueId(), topicId: topic.id })
        await storage.chat.addChatLLMConfig(cnf)
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
    return withTransaction("rw", ["chatMessage"], async tx => {
      const all = [message, ...message.children]
      all.forEach(child => {
        const msg = unwrapMessage(child)
        // virtual nodes did not have context, no error occured
        msgMgr.terminate(msg.topicId, msg.id, true)
      })
      if (isArrayLength(message.children)) {
        await storage.chat.bulkDeleteChatMessage(
          message.children.map(m => unwrapMessage(m).id),
          { transaction: tx }
        )
      }
      if (!unwrapMessage(message).id.startsWith(VirtualNodeIdPrefix)) {
        await storage.chat.deleteChatMessage(unwrapMessage(message).id, { transaction: tx })
      }
      removeMessage(message, chatMessage)
      chatMessageMap.delete(message.id)
    })
  }
  async function deleteAllMessage(topic: ChatTopic) {
    const recursiveMove = (node: ChatMessageTree) => {
      const msg = unwrapMessage(node)
      msgMgr.terminate(msg.topicId, msg.id, true)
      node.children.forEach(child => {
        recursiveMove(child)
        chatMessageMap.delete(child.id)
      })
    }
    findChatMessage(topic.id, chatMessage)
      ?.filter(m => unwrapMessage(m).topicId === topic.id)
      .forEach(recursiveMove)
    await storage.chat.deleteAllMessages(topic.id)
    if (chatMessage[topic.id]) {
      chatMessage[topic.id].length = 0
    }
  }
  async function updateChatTopic(topic: ChatTopic) {
    return storage.chat.putChatTopic(topic)
  }
  async function updateChatMessage(msg: ChatMessage) {
    return storage.chat.putChatMessage(msg)
  }
  /**
   * 数据库中添加一个新的 `topic`
   * @param append 是否添加到 `topicList` 缓存列表末尾
   */
  async function addChatTopic(topic: ChatTopic, append?: boolean): Promise<ChatTopicTree> {
    await storage.chat.addChatTopic(topic)
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
    await msgMgr.addNewMessages([msg])
    const msgNode = reactive(wrapMessage(msg))
    chatMessageMap.set(msgNode.id, msgNode)
    chatMessage[msg.topicId].splice(index ?? 0, 0, msgNode)
  }
  async function updateChatLLMConfig(cnf: ChatLLMConfig) {
    await storage.chat.putChatLLMConfig(cnf)
    chatLLMConfig[cnf.topicId] = cnf
  }
  async function updateChatTTIConfig(cnf: ChatTTIConfig) {
    await storage.chat.putChatTTIConfig(cnf)
    chatTTIConfig[cnf.topicId] = cnf
  }
  async function removeChatTopic(nodes: ChatTopic[]) {
    return storage.chat.bulkDeleteChatTopic(nodes)
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
   * initially load chat data from the database and listen message event
   */
  async function init() {
    topicList.length = 0
    topicMap.clear()
    const data = await storage.chat.fetch()
    const defaultData = chatTopicDefault()
    const newDefault: ChatTopic[] = []
    for (const item of defaultData) {
      if (!data.find(v => v.id === item.id)) {
        newDefault.push(item)
      }
    }
    if (newDefault.length) {
      data.push(...newDefault)
      await storage.chat.bulkAddChatTopics(newDefault)
    }
    topicList.push(
      ...assembleTopicTree(data, item => {
        const tree: ChatTopicTree = reactive({ id: item.id, node: item, children: [] })
        tree.node.requestCount = 0
        topicMap.set(tree.node.id, tree)
        return tree
      })
    )
    msgMgr.removeAllListener()
    msgMgr.on("message", data => _onReceiveMessage(data.data, data.contextId))
  }
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
