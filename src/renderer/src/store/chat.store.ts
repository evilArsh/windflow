import { defineStore, storeToRefs } from "pinia"
import {
  ChatContext,
  ChatMessage,
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
import { indexKey, storeKey, useDatabase } from "@renderer/usable/useDatabase"
import { ElMessage } from "element-plus"
import useProviderStore from "./provider.store"
import useModelsStore from "./model.store"
import useSettingsStore from "./settings.store"
import { CallBackFn } from "@renderer/lib/shared/types"

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

export default defineStore(storeKey.chat_topic, () => {
  const { add: dbAdd, put, get, request, wrapTransaction, count } = useDatabase()
  const providerStore = useProviderStore()
  const modelsStore = useModelsStore()
  const settingsStore = useSettingsStore()
  const { providerMetas } = storeToRefs(providerStore)

  const topicList = reactive<Array<ChatTopicTree>>([]) // 聊天组列表
  const chatMessage = reactive<Record<string, ChatMessage>>({}) // 聊天信息缓存,messageId作为key
  // 文本聊天请求缓存, 切换聊天时，继续请求,使用topicId作为key
  const llmChats = reactive<Record<string, ChatContext[]>>({})
  const currentTopic = ref<ChatTopicTree>() // 选中的聊天
  const currentMessage = ref<ChatMessage>() // 选中的消息
  const currentNodeKey = ref<string>("") // 选中的聊天节点key,和数据库绑定
  const getChatTopicContext = (
    topicId: string,
    modelId: string,
    messageId: string,
    provider: LLMProvider,
    message: ChatMessage
  ) => {
    if (!llmChats[topicId]) {
      llmChats[topicId] = []
      llmChats[topicId].push({
        modelId: modelId,
        provider: markRaw(provider),
        message: message,
        messageId: messageId,
      })
      return llmChats[topicId][0]
    }
    const res = llmChats[topicId].find(item => item.messageId === messageId)
    if (!res) {
      llmChats[topicId].push({
        modelId: modelId,
        provider: markRaw(provider),
        message: message,
        messageId: messageId,
      })
      return llmChats[topicId].slice(-1)[0]
    }
    return res
  }

  /**
   * @description 获取消息上下文，最后一个消息必须是`Role.User`,`DeepSeek-r1`要求消息必须是`Role.User`和`Role.Assistant`交替出现
   * TODO: 中间有删除消息时,删除与之配对的`Role.Assistant`或者`Role.User`消息
   */
  const getMessageContext = (topic: ChatTopic, message: ChatMessage["data"]) => {
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
    if (!context.find(val => val.role === Role.System)) {
      context.unshift({ role: Role.System, content: topic.prompt })
    }
    return context
  }

  /**
   * @description 发送消息
   */
  const sendMessage = (
    topic: ChatTopic,
    chatContext: ChatContext,
    context: LLMChatMessage[],
    model: ModelMeta,
    providerMeta: ProviderMeta,
    newMessage: ChatMessage["data"][number]
  ) => {
    topic.requestCount++
    if (!chatContext.provider) return
    chatContext.handler = chatContext.provider.chat(context, model, providerMeta, async msg => {
      newMessage.status = msg.status
      newMessage.reasoning = msg.reasoning
      newMessage.content.content += msg.data.map(item => item.content).join("")
      newMessage.content.reasoningContent += msg.data.map(item => item.reasoningContent).join("")
      if (msg.status == 206) {
        newMessage.finish = false
      } else if (msg.status == 200) {
        newMessage.finish = true
        topic.requestCount--
        console.log(`[message done] ${msg.status}`)
      } else if (msg.status == 100) {
        console.log(`[message pending] ${msg.status}`)
      } else {
        newMessage.finish = true
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
  const dbUpdateChatTopic = useThrottleFn(
    async (data: ChatTopic) => await put("chat_topic", data.id, toRaw(data)),
    300,
    true
  )
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
  async function dbAddChatTopic(data: ChatTopic) {
    return await dbAdd("chat_topic", toRaw(data))
  }
  async function dbAddChatMessage(data: ChatMessage) {
    return await dbAdd("chat_message", toRaw(data))
  }
  const dbUpdateChatMessage = useDebounceFn(
    async (data: ChatMessage) => await put("chat_message", data.id, toRaw(data)),
    300,
    { maxWait: 1000 }
  )
  async function dbFindChatMessage(id: string) {
    const res = await get<ChatMessage>("chat_message", id)
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
  async function dbDelChatTopic(data: ChatTopic[]) {
    return await request(async db => {
      const ts = db.transaction([storeKey.chat_message, storeKey.chat_topic], "readwrite")
      const storeTopic = ts.objectStore(storeKey.chat_topic)
      const storeMessage = ts.objectStore(storeKey.chat_message)
      for (const item of data) {
        storeTopic.delete(item.id)
        if (item.chatMessageId) {
          storeMessage.delete(item.chatMessageId)
        }
      }
      return await wrapTransaction(ts)
    })
  }

  function terminate(done: CallBackFn, topicId?: string, messageId?: string) {
    if (!(topicId && messageId)) {
      console.warn(`[terminate] topicId or messageId is empty.${topicId} ${messageId}`)
      return
    }
    if (llmChats[topicId]) {
      const chatContext = llmChats[topicId].find(item => item.messageId === messageId)
      if (chatContext) {
        chatContext.handler?.terminate()
      }
    } else {
      console.warn(`[terminate] chatContext not found.${topicId} ${messageId}`)
    }
    done()
  }

  function restart(done: CallBackFn, topic?: ChatTopic, currentMessageId?: string, currentSubMessageId?: string) {
    if (!(topic && currentMessageId && currentSubMessageId)) {
      console.warn(
        `[restart] topic or currentMessageId or currentSubMessageId is empty.${topic} ${currentMessageId} ${currentSubMessageId}`
      )
      return
    }
    if (!llmChats[topic.id]) {
      llmChats[topic.id] = []
    }
    const message = chatMessage[currentMessageId]
    if (!message) {
      console.warn(`[restart] message not found.${currentMessageId}`)
      return
    }
    const messageItem = message.data.find(item => item.id === currentSubMessageId)
    if (!messageItem) {
      console.warn(`[restart] messageItem not found.${currentSubMessageId}`)
      return
    }
    const chatContext = llmChats[topic.id].find(item => item.messageId === messageItem.id)
    const meta = getMeta(messageItem.modelId)
    if (!meta) return
    const { model, providerMeta, provider } = meta
    const contextIndex = message.data.findIndex(item => item.id === messageItem.id)
    const context = getMessageContext(topic, message.data.slice(0, contextIndex)) // 消息上下文
    messageItem.content = { role: "assistant", content: "", reasoningContent: "" }
    messageItem.finish = false
    messageItem.status = 200
    messageItem.time = formatSecond(new Date())
    if (chatContext) {
      if (chatContext.handler) {
        chatContext.handler.restart()
      } else {
        if (!chatContext.provider) chatContext.provider = provider
        sendMessage(topic, chatContext, context, model, providerMeta, messageItem)
      }
    } else {
      const chatContext = getChatTopicContext(topic.id, messageItem.modelId, messageItem.id, provider, message) // 获取聊天信息上下文
      sendMessage(topic, chatContext, context, model, providerMeta, messageItem)
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
        const chatContext = llmChats[topic.id].find(item => item.messageId === message.data[msgIndex + 1].id)
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

  async function send(topic: ChatTopic, message: ChatMessage) {
    if (!topic.content.trim()) return
    if (topic.modelIds.length == 0) {
      ElMessage.warning("请选择模型")
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
      const newMessage = reactive<ChatMessage["data"][number]>({
        id: uniqueId(),
        finish: false,
        status: 200,
        time: formatSecond(new Date()),
        content: { role: "assistant", content: "", reasoningContent: "" },
        modelId,
      })
      const chatContext = getChatTopicContext(topic.id, modelId, newMessage.id, provider, message) // 获取聊天信息上下文
      if (!chatContext.provider) chatContext.provider = provider
      chatContext.message.data.push(newMessage)
      sendMessage(topic, chatContext, context, model, providerMeta, newMessage)
    }
    topic.content = ""
  }
  function mountContext(val: ChatTopic, message: ChatMessage) {
    if (!llmChats[val.id]) {
      llmChats[val.id] = val.modelIds.map(modelId => {
        return {
          modelId,
          message: message,
          provider: undefined,
          handler: undefined,
          messageId: message.id,
        }
      })
    }
  }
  const fetch = async () => {
    try {
      const total = await count("chat_topic")
      if (total > 0) {
        const data = await request<ChatTopic[]>(async db => {
          const index = db
            .transaction(storeKey.chat_topic, "readonly")
            .objectStore(storeKey.chat_topic)
            .index(indexKey.chatTopic_createAt_idx)
          const res = await new Promise<ChatTopic[]>(resolve => {
            const results: ChatTopic[] = []
            index.openCursor(null, "next").onsuccess = e => {
              const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
              if (cursor) {
                results.push(cursor.value as ChatTopic)
                cursor.continue()
              } else {
                resolve(results)
              }
            }
          })
          return res
        })
        // --- 恢复状态
        if (data) {
          const nodeKeyData = await get<Settings<string>>("settings", "chat.currentNodeKey")
          currentNodeKey.value = nodeKeyData ? nodeKeyData.value : ""
          topicList.push(
            ...assembleTopicTree(data, async item => {
              if (item.id === currentNodeKey.value) {
                currentTopic.value = item
                if (item.node.chatMessageId) {
                  const msg = await dbFindChatMessage(item.node.chatMessageId)
                  if (msg) {
                    chatMessage[msg.id] = msg
                    currentMessage.value = msg
                  }
                }
              }
            })
          )
        }
      } else {
        const data = chatTopicDefault()
        topicList.push(
          ...assembleTopicTree(data, item => {
            if (item.id === currentNodeKey.value) {
              currentTopic.value = item
            }
          })
        )
        for (const item of data) {
          await dbAdd("chat_topic", item)
        }
      }
    } catch (error) {
      console.error(`[fetch chat topic] ${(error as Error).message}`)
    }
  }
  settingsStore.dataWatcher<string>("chat.currentNodeKey", currentNodeKey, "")

  fetch()
  return {
    topicList,
    chatMessage,
    llmChats,
    currentTopic,
    currentMessage,
    currentNodeKey,
    mountContext,
    terminate,
    deleteSubMessage,
    restart,
    dbUpdateChatTopic,
    dbAddChatTopic,
    dbFindChatMessage,
    dbAddChatMessage,
    dbUpdateChatMessage,
    dbDelChatTopic,
    send,
    refreshChatTopicModelIds,
  }
})
