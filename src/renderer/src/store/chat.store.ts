import { defineStore, storeToRefs } from "pinia"
import {
  ChatContext,
  ChatMessage,
  ChatMessageData,
  ChatTopic,
  ChatTopicTree,
  LLMChatMessage,
  LLMProvider,
  ModelMeta,
  ProviderMeta,
  Role,
  Settings,
} from "@renderer/types"
import { chatTopicDefault } from "./default/chat.default"
import { useDebounceFn, useThrottleFn } from "@vueuse/core"
import { db } from "@renderer/usable/useDatabase"
import { ElMessage } from "element-plus"
import useProviderStore from "./provider.store"
import useModelsStore from "./model.store"
import useSettingsStore from "./settings.store"
import { CallBackFn } from "@renderer/lib/shared/types"
import { Reactive, Ref } from "vue"

const useData = (
  topicList: Reactive<Array<ChatTopicTree>>,
  chatMessage: Reactive<Record<string, ChatMessage>>,
  currentTopic: Ref<ChatTopicTree | undefined>,
  currentMessage: Ref<ChatMessage | undefined>,
  currentNodeKey: Ref<string>
) => {
  const settingsStore = useSettingsStore()
  function topicToTree(topic: ChatTopic): ChatTopicTree {
    return { id: topic.id, node: topic, children: [] }
  }
  function assembleTopicTree(data: ChatTopic[], cb: (item: ChatTopicTree) => void): ChatTopicTree[] {
    const res: ChatTopicTree[] = []
    const maps: Record<string, ChatTopicTree> = {}
    data.forEach(item => {
      item.requestCount = 0
      maps[item.id] = topicToTree(item)
      cb(maps[item.id])
    })
    data.forEach(item => {
      if (!item.parentId) {
        res.push(maps[item.id])
      } else {
        if (maps[item.parentId]) {
          maps[item.parentId].children.push(maps[item.id])
        }
      }
    })
    return res
  }
  const updateChatTopic = useThrottleFn(async (data: ChatTopic) => await db.chatTopic.put(toRaw(data)), 300, true)

  async function addChatTopic(data: ChatTopic) {
    return await db.chatTopic.add(toRaw(data))
  }
  async function addChatMessage(data: ChatMessage) {
    return await db.chatMessage.add(toRaw(data))
  }
  const updateChatMessage = useDebounceFn(async (data: ChatMessage) => await db.chatMessage.put(toRaw(data)), 300, {
    maxWait: 1000,
  })
  async function findChatMessage(id: string) {
    const res = await db.chatMessage.get(id)
    if (res) {
      res.data.forEach(item => {
        item.finish = true
        item.status = 200
      })
    }
    return res
  }
  /**
   * @description 删除对应的聊天组和聊天消息
   */
  async function delChatTopic(data: ChatTopic[]) {
    return await db
      .transaction("rw", db.chatMessage, db.chatTopic, async trans => {
        for (const item of data) {
          trans.chatTopic.delete(item.id)
          if (item.chatMessageId) {
            trans.chatMessage.delete(item.chatMessageId)
          }
        }
      })
      .then(() => {
        return true
      })
      .catch(error => {
        console.log(`[dbDelChatTopic]`, error)
        return false
      })
  }
  const fetch = async () => {
    try {
      const total = await db.chatTopic.count()
      if (total > 0) {
        const data = await db.chatTopic.orderBy("createAt").toArray()
        // --- 恢复状态
        const nodeKeyData = (await db.settings.get("chat.currentNodeKey")) as Settings<string> | undefined
        currentNodeKey.value = nodeKeyData ? nodeKeyData.value : ""
        topicList.push(
          ...assembleTopicTree(data, async item => {
            if (item.id === currentNodeKey.value) {
              currentTopic.value = item
              if (item.node.chatMessageId) {
                const msg = await db.chatMessage.get(item.node.chatMessageId)
                if (msg) {
                  chatMessage[msg.id] = msg
                  currentMessage.value = msg
                }
              }
            }
          })
        )
      } else {
        const data = chatTopicDefault()
        topicList.push(
          ...assembleTopicTree(data, item => {
            if (item.id === currentNodeKey.value) {
              currentTopic.value = item
            }
          })
        )
        await db.chatTopic.bulkAdd(data)
      }
    } catch (error) {
      console.error(`[fetch chat topic] ${(error as Error).message}`)
    }
  }
  fetch()
  settingsStore.api.dataWatcher<string>("chat.currentNodeKey", currentNodeKey, "")
  return {
    topicToTree,
    assembleTopicTree,
    updateChatTopic,
    addChatTopic,
    addChatMessage,
    updateChatMessage,
    findChatMessage,
    delChatTopic,
  }
}
const useContext = () => {
  // 文本聊天请求缓存, 切换聊天时，继续请求,使用topicId作为key
  const llmChats = reactive<Record<string, ChatContext[]>>({})
  const fetchTopicContext = (
    topicId: string,
    modelId: string,
    messageDataId: string,
    messageId: string,
    provider: LLMProvider
  ) => {
    if (!llmChats[topicId]) {
      llmChats[topicId] = []
      llmChats[topicId].push({
        modelId: modelId,
        provider: markRaw(provider),
        messageId: messageId,
        messageDataId: messageDataId,
      })
      return llmChats[topicId][0]
    }
    const res = llmChats[topicId].find(item => item.messageId === messageId && item.messageDataId === messageDataId)
    if (!res) {
      llmChats[topicId].push({
        modelId: modelId,
        provider: markRaw(provider),
        messageId: messageId,
        messageDataId: messageDataId,
      })
      return llmChats[topicId].slice(-1)[0]
    } else {
      if (!res.provider) {
        res.provider = provider
      }
    }
    return res
  }

  /**
   * @description 获取消息上下文，最后一个消息必须是`Role.User`,`DeepSeek-r1`要求消息必须是`Role.User`和`Role.Assistant`交替出现
   * TODO: 中间有删除消息时,删除与之配对的`Role.Assistant`或者`Role.User`消息
   */
  const getMessageContext = (topic: ChatTopic, message: ChatMessageData[]) => {
    const context: LLMChatMessage[] = []
    let sysTick = false
    for (let i = message.length - 1; i >= 0; i--) {
      const item = message[i]
      if (!sysTick) {
        if (item.content.role == Role.User) {
          sysTick = !sysTick
          context.unshift(item.content)
        } else {
          break
        }
      } else {
        if (item.content.role == Role.Assistant) {
          sysTick = !sysTick
          context.unshift(item.content)
        } else if (item.content.role == Role.System) {
          context.unshift(item.content)
          break
        } else if (item.content.role == Role.Tool) {
          context.unshift(item.content)
          break
        } else {
          break
        }
      }
    }
    context.unshift({ role: Role.System, content: topic.prompt })
    return context
  }
  function mountContext(val: ChatTopic, message: ChatMessage) {
    if (!val.chatMessageId) {
      console.warn("[mountContext] chatMessageId is empty")
      return
    }
    if (!llmChats[val.id]) {
      llmChats[val.id] = message.data.map<ChatContext>(msgData => {
        return {
          messageId: val.chatMessageId,
          messageDataId: msgData.id,
          modelId: msgData.modelId,
          provider: undefined,
          handler: undefined,
        } as ChatContext
      })
    }
  }
  function hasTopic(topicId: string) {
    return llmChats[topicId]
  }
  function findContext(topicId: string, messageDataId: string) {
    if (hasTopic(topicId)) {
      return llmChats[topicId].find(item => item.messageDataId === messageDataId)
    }
    console.warn(`[findContext] topicId not found.${topicId} ${messageDataId}`)
    return undefined
  }
  function findTopic(topicId: string) {
    return llmChats[topicId]
  }
  function initContext(topicId: string) {
    if (!llmChats[topicId]) {
      llmChats[topicId] = []
    }
  }

  return {
    fetchTopicContext,
    getMessageContext,
    mountContext,
    hasTopic,
    findContext,
    findTopic,
    initContext,
  }
}
export default defineStore("chat_topic", () => {
  const providerStore = useProviderStore()
  const modelsStore = useModelsStore()
  const { providerMetas } = storeToRefs(providerStore)
  const { fetchTopicContext, getMessageContext, mountContext, findContext, initContext, findTopic } = useContext()
  const topicList = reactive<Array<ChatTopicTree>>([]) // 聊天组列表
  const chatMessage = reactive<Record<string, ChatMessage>>({}) // 聊天信息缓存,messageId作为key
  const currentTopic = ref<ChatTopicTree>() // 选中的聊天
  const currentMessage = ref<ChatMessage>() // 选中的消息
  const currentNodeKey = ref<string>("") // 选中的聊天节点key,和数据库绑定
  const { updateChatTopic, addChatTopic, addChatMessage, updateChatMessage, findChatMessage, delChatTopic } = useData(
    topicList,
    chatMessage,
    currentTopic,
    currentMessage,
    currentNodeKey
  )

  /**
   * @description 发送消息
   */
  const sendMessage = (
    topic: ChatTopic,
    chatContext: ChatContext,
    context: LLMChatMessage[],
    model: ModelMeta,
    providerMeta: ProviderMeta,
    message: ChatMessageData
  ) => {
    topic.requestCount++
    if (!chatContext.provider) return
    chatContext.handler = chatContext.provider.chat(context, model, providerMeta, async msg => {
      message.status = msg.status
      message.reasoning = msg.reasoning
      message.content.content += msg.data.map(item => item.content).join("")
      message.content.reasoningContent += msg.data.map(item => item.reasoningContent).join("")
      if (msg.status == 206) {
        message.finish = false
      } else if (msg.status == 200) {
        message.finish = true
        topic.requestCount--
        console.log(`[message done] ${msg.status}`)
      } else if (msg.status == 100) {
        console.log(`[message pending] ${msg.status}`)
      } else {
        message.finish = true
        topic.requestCount--
        console.log(`[message] ${msg.status}`)
      }
    })
  }

  const getMeta = (modelId: string) => {
    if (modelId.length == 0) {
      console.warn("[getMeta] modelId is empty")
      return
    }
    const model = modelsStore.find(modelId) // 模型元数据
    const providerMeta: ProviderMeta | undefined = providerMetas.value[model?.providerName ?? ""] // 提供商元数据
    if (!(model && providerMeta)) {
      console.warn("[getMeta] model or providerMeta not found", modelId)
      return
    }
    const provider = providerStore.providerManager.getLLMProvider(model.providerName)
    if (!provider) {
      console.warn("[getMeta] provider not found", model.providerName)
      return
    }
    return { model, providerMeta, provider }
  }
  function refreshChatTopicModelIds(topic?: ChatTopic) {
    if (!topic) return
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

  function terminate(done: CallBackFn, topicId?: string, messageDataId?: string) {
    if (!(topicId && messageDataId)) {
      console.warn(`[terminate] topicId or messageId is empty.${topicId} ${messageDataId}`)
      return
    }
    const chatContext = findContext(topicId, messageDataId)
    if (chatContext) {
      chatContext.handler?.terminate()
    }
    done()
  }
  function terminateAll(topicId: string) {
    const topic = findTopic(topicId)
    if (!topic) {
      console.warn(`[terminateAll] topic not found.${topicId}`)
      return
    }
    topic.forEach(item => {
      item.handler?.terminate()
    })
  }

  function restart(done: CallBackFn, topic?: ChatTopic, messageDataId?: string) {
    if (!(topic && messageDataId)) {
      console.warn(`[restart] topic or messageDataId is empty.${topic} ${messageDataId}`)
      return
    }
    if (!topic.chatMessageId) {
      console.warn(`[restart] chatMessageId is empty.${topic}`)
      return
    }
    initContext(topic.id)
    const message = chatMessage[topic.chatMessageId]
    if (!message) {
      console.warn(`[restart] message not found.${topic.chatMessageId}`)
      return
    }
    const messageData = message.data.find(data => data.id === messageDataId)
    if (!messageData) {
      console.warn(`[restart] messageItem not found.${messageDataId}`)
      return
    }
    const chatContext = findContext(topic.id, messageData.id)
    const meta = getMeta(messageData.modelId)
    if (!meta) return
    const { model, providerMeta, provider } = meta
    const contextIndex = message.data.findIndex(item => item.id === messageData.id)
    const context = getMessageContext(topic, message.data.slice(0, contextIndex)) // 消息上下文
    messageData.content = { role: "assistant", content: "", reasoningContent: "" }
    messageData.finish = false
    messageData.status = 200
    messageData.time = formatSecond(new Date())
    if (chatContext) {
      if (chatContext.handler) {
        chatContext.handler.restart()
      } else {
        if (!chatContext.provider) chatContext.provider = provider
        sendMessage(topic, chatContext, context, model, providerMeta, messageData)
      }
    } else {
      const chatContext = fetchTopicContext(topic.id, messageData.modelId, messageData.id, message.id, provider) // 获取聊天信息上下文
      sendMessage(topic, chatContext, context, model, providerMeta, messageData)
    }
    done()
  }

  /**
   * @description 删除一条消息列表的消息
   */
  function deleteSubMessage(topic?: ChatTopic, message?: ChatMessage, currentId?: string) {
    if (!(message && currentId && topic)) {
      console.warn(`[deleteSubMessage] message or currentId or topic is empty.${message} ${currentId} ${topic}`)
      return
    }
    const msgIndex = message.data.findIndex(item => item.id === currentId)
    if (isIndexOutOfRange(msgIndex, message.data.length)) {
      console.warn(`[deleteSubMessage] msgIndex is out of range.${msgIndex}`)
      return
    }
    const current = message.data[msgIndex]
    if (current.content.role === Role.System) {
      console.warn(`[deleteSubMessage] system message cannot be deleted.${msgIndex}`)
      return
    } else if (current.content.role === Role.User) {
      if (!isIndexOutOfRange(msgIndex + 1, message.data.length)) {
        // 删除之前先终止
        const chatContext = findContext(topic.id, message.data[msgIndex + 1].id)
        if (chatContext) {
          chatContext.handler?.terminate()
        }
        message.data.splice(msgIndex, 2)
      } else {
        message.data.splice(msgIndex, 1)
      }
    } else if (current.content.role === Role.Assistant) {
      if (!isIndexOutOfRange(msgIndex - 1, message.data.length)) {
        const prev = message.data[msgIndex - 1]
        if (prev.content.role === Role.User) {
          message.data.splice(msgIndex - 1, 2)
        } else {
          message.data.splice(msgIndex, 1)
        }
      } else {
        message.data.splice(msgIndex, 1)
      }
    }
  }

  async function send(topic?: ChatTopic) {
    if (!topic) return
    if (!topic.content.trim()) return
    if (topic.modelIds.length == 0) {
      ElMessage.warning("请选择模型")
      return
    }
    if (!topic.chatMessageId) {
      console.warn("[send] topic.chatMessageId is empty")
      return
    }
    const message = chatMessage[topic.chatMessageId]
    if (!message) {
      console.warn("[send] message not found")
      return
    }
    message.data.push({
      id: uniqueId(),
      status: 200,
      time: formatSecond(new Date()),
      finish: true,
      reasoning: false,
      content: {
        role: "user",
        content: topic.content,
      },
      modelId: "",
    })
    const context = getMessageContext(topic, message.data) // 消息上下文
    for (const modelId of topic.modelIds) {
      const meta = getMeta(modelId)
      if (!meta) continue
      const { model, providerMeta, provider } = meta
      // 单个请求的消息
      const newMessageData = reactive<ChatMessageData>({
        id: uniqueId(),
        finish: false,
        status: 200,
        time: formatSecond(new Date()),
        content: { role: "assistant", content: "", reasoningContent: "" },
        modelId,
      })
      const chatContext = fetchTopicContext(topic.id, modelId, newMessageData.id, message.id, provider) // 获取聊天信息上下文
      message.data.push(newMessageData)
      sendMessage(topic, chatContext, context, model, providerMeta, newMessageData)
    }
    topic.content = ""
  }

  return {
    topicList,
    chatMessage,
    currentTopic,
    currentMessage,
    currentNodeKey,
    mountContext,
    terminate,
    deleteSubMessage,
    restart,
    send,
    refreshChatTopicModelIds,
    terminateAll,
    api: {
      updateChatTopic,
      addChatTopic,
      addChatMessage,
      updateChatMessage,
      findChatMessage,
      delChatTopic,
    },
  }
})
