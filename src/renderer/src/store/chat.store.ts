import { defineStore, storeToRefs } from "pinia"
import {
  ChatContext,
  ChatMessage,
  ChatMessageData,
  ChatTopic,
  ChatTopicTree,
  LLMChatMessage,
  LLMProvider,
  ModelType,
  ProviderMeta,
  Role,
  Settings,
} from "@renderer/types"
import { chatMessageDefault, chatTopicDefault } from "./default/chat.default"
import { useDebounceFn } from "@vueuse/core"
import { db } from "@renderer/usable/useDatabase"
import useProviderStore from "./provider.store"
import useModelsStore from "./model.store"
import useSettingsStore from "./settings.store"
import { CallBackFn } from "@renderer/lib/shared/types"
import { Reactive, Ref } from "vue"
import { cloneDeep } from "lodash"

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
  const updateChatTopic = useDebounceFn(async (data: ChatTopic) => db.chatTopic.update(data.id, toRaw(data)), 500, {
    maxWait: 2000,
  })

  async function addChatTopic(data: ChatTopic) {
    return db.chatTopic.add(toRaw(data))
  }
  async function addChatMessage(data: ChatMessage) {
    return db.chatMessage.add(toRaw(data))
  }
  const updateChatMessage = useDebounceFn(
    async (data: ChatMessage) => db.chatMessage.update(data.id, toRaw(data)),
    500,
    {
      maxWait: 2000,
    }
  )
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
    return db
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
      topicList.length = 0
      for (const key in chatMessage) {
        delete chatMessage[key]
      }
      const data = await db.chatTopic.orderBy("createAt").toArray()
      const defaultData = chatTopicDefault()
      for (const item of defaultData) {
        if (!data.find(v => v.id === item.id)) {
          data.push(item)
          await db.chatTopic.add(item)
        }
      }
      // --- 恢复状态
      const nodeKeyData = (await db.settings.get("chat.currentNodeKey")) as Settings<string> | undefined
      currentNodeKey.value = nodeKeyData ? nodeKeyData.value : ""
      topicList.push(
        ...assembleTopicTree(data, async item => {
          if (item.id === currentNodeKey.value) {
            currentTopic.value = item
            let msg: ChatMessage | undefined = undefined
            if (item.node.chatMessageId) {
              msg = await db.chatMessage.get(item.node.chatMessageId)
            }
            msg = msg ?? chatMessageDefault()
            chatMessage[msg.id] = msg
            currentMessage.value = msg
            item.node.chatMessageId = msg.id
            msg.data.forEach(v => {
              v.finish = true
              v.status = 200
            })
          }
        })
      )
    } catch (error) {
      console.error(`[fetch chat topic] ${(error as Error).message}`)
    }
  }
  settingsStore.api.dataWatcher<string>("chat.currentNodeKey", currentNodeKey, "")
  return {
    fetch,
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
   * @description 获取消息上下文，最后一个消息必须是`Role.User`,
   * `DeepSeek-r1`要求消息必须是`Role.User`和`Role.Assistant`交替出现,
   * mcp调用中存在{tool_calls:[]}和{tool_call_id:""},存在`item.toolCallsChain`中，
   * 提交时作为消息上下文
   *
   * TODO: 中间有删除消息时,删除与之配对的`Role.Assistant`或者`Role.User`消息
   */
  const getMessageContext = (topic: ChatTopic, message: ChatMessageData[]) => {
    const context: LLMChatMessage[] = []
    let sysTick = false
    for (let i = message.length - 1; i >= 0; i--) {
      const item = cloneDeep(message[i])
      // deepseek patch
      item.content.reasoning_content = undefined
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
          if (isArray(item.toolCallsChain)) {
            context.unshift(...item.toolCallsChain)
          }
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
    context.unshift({ role: Role.System, content: JSON.stringify([{ type: "text", content: topic.prompt }]) })
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
  const api = useData(topicList, chatMessage, currentTopic, currentMessage, currentNodeKey)

  const getMeta = (modelId: string) => {
    if (!modelId) {
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
  /**
   * @description 发送消息
   */
  const sendMessage = (topic: ChatTopic, message: ChatMessage, messageParent: ChatMessageData) => {
    const messageGroup =
      isArray(messageParent.children) && messageParent.children.length > 0 ? messageParent.children : [messageParent]
    messageGroup.forEach(messageItem => {
      const meta = getMeta(messageItem.modelId)
      if (!meta) return
      const { model, providerMeta, provider } = meta
      let chatContext = findContext(topic.id, messageItem.id)
      const messageContextIndex = message.data.findIndex(item => item.id === messageParent.id)
      // 消息上下文
      const messageContext = getMessageContext(topic, message.data.slice(0, messageContextIndex))
      messageItem.content = { role: "assistant", content: "", reasoning_content: "" }
      messageItem.finish = false
      messageItem.status = 100
      messageItem.time = formatSecond(new Date())
      // 获取聊天框上下文
      chatContext =
        chatContext ?? fetchTopicContext(topic.id, messageItem.modelId, messageItem.id, message.id, provider)
      if (!chatContext.provider) chatContext.provider = provider
      if (chatContext.handler) chatContext.handler.terminate()

      const mcpServersIds = topic.mcpServers.filter(v => !v.disabled).map(v => v.id)
      topic.requestCount = Math.max(1, topic.requestCount + 1)
      chatContext.handler = chatContext.provider.chat(messageContext, model, providerMeta, mcpServersIds, res => {
        if (res.tool_calls_chain) {
          messageItem.toolCallsChain = messageItem.toolCallsChain ?? []
          messageItem.toolCallsChain.push(res)
        } else {
          messageItem.status = res.status
          messageItem.reasoning = model.type === ModelType.ChatReasoner
          if (isString(res.content)) messageItem.content.content += res.content
          if (res.reasoning_content) messageItem.content.reasoning_content += res.reasoning_content
          if (res.status == 206) {
            messageItem.finish = false
          } else if (res.status == 200) {
            messageItem.finish = true
            topic.requestCount = Math.max(0, topic.requestCount - 1)
            console.log(`[message done] ${res.status}`)
            if (topic.label === window.defaultTopicTitle && chatContext.provider) {
              chatContext.provider.titleSummary(JSON.stringify(messageItem), model, providerMeta).then(res => {
                if (res) topic.label = res
              })
            }
          } else if (res.status == 100) {
            messageItem.finish = false
            console.log(`[message pending] ${res.status}`)
          } else {
            messageItem.finish = true
            topic.requestCount = Math.max(0, topic.requestCount - 1)
            console.log(`[message] ${res.status}`)
          }
        }
        api.updateChatMessage(message)
      })
    })
  }
  function restart(topic?: ChatTopic, messageDataId?: string) {
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
    messageData.toolCallsChain = []
    sendMessage(topic, message, messageData)
  }
  function send(topic?: ChatTopic) {
    if (!topic) return
    if (!topic.content.trim()) return
    if (topic.modelIds.length == 0) {
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
    const id = uniqueId()
    message.data.push({
      id,
      status: 200,
      time: formatSecond(new Date()),
      finish: true,
      reasoning: false,
      content: { role: "user", content: topic.content },
      modelId: "",
    })
    const newMessageData = reactive<ChatMessageData>({
      id: uniqueId(),
      status: 200,
      content: { role: "assistant", content: "", reasoning_content: "" },
      modelId: "",
      time: formatSecond(new Date()),
      children: [],
    })
    const availiableModels = topic.modelIds.filter(modelId => getMeta(modelId))
    if (availiableModels.length > 1) {
      availiableModels.forEach(modelId => {
        newMessageData.children!.push(
          reactive<ChatMessageData>({
            id: uniqueId(),
            parentId: id,
            status: 200,
            content: { role: "assistant", content: "", reasoning_content: "" },
            modelId,
            time: formatSecond(new Date()),
          })
        )
      })
    } else {
      newMessageData.modelId = availiableModels[0]
    }
    message.data.push(newMessageData)
    sendMessage(topic, message, newMessageData)
    topic.content = ""
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
    api.updateChatMessage(message)
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
    api,
  }
})
