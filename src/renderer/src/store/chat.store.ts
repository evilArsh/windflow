import { defineStore, storeToRefs } from "pinia"
import { ChatContext, ChatMessage, ChatTopic, ChatTopicTree, LLMChatMessage, LLMProvider, Role } from "@renderer/types"
import { chatTopicDefault } from "./default/chat.default"
import { useDebounceFn, useThrottleFn } from "@vueuse/core"
import { indexKey, storeKey, useDatabase } from "@renderer/usable/useDatabase"
import { ElMessage } from "element-plus"
import useProviderStore from "./provider.store"
import useModelsStore from "./model.store"

function topicToTree(topic: ChatTopic): ChatTopicTree {
  return { id: topic.id, node: topic, children: [] }
}

function assembleTopicTree(data: ChatTopic[]): ChatTopicTree[] {
  const res: ChatTopicTree[] = []
  const maps: Record<string, ChatTopicTree> = {}
  data.forEach(item => {
    maps[item.id] = topicToTree(item)
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
  const { providerMetas } = storeToRefs(providerStore)

  const topicList = reactive<Array<ChatTopicTree>>([]) // 聊天组列表
  const chatMessage = reactive<Record<string, ChatMessage>>({}) // 聊天信息缓存
  // 文本聊天请求缓存, 切换聊天时，继续请求,使用topicId作为key
  const llmChats = reactive<Record<string, ChatContext[]>>({})

  const dbUpdateChatTopic = useThrottleFn(
    async (data: ChatTopic) => await put("chat_topic", data.id, toRaw(data)),
    300,
    true
  )
  const dbAddChatTopic = async (data: ChatTopic) => await dbAdd("chat_topic", toRaw(data))
  const dbAddChatMessage = async (data: ChatMessage) => await dbAdd("chat_message", toRaw(data))
  const dbUpdateChatMessage = useDebounceFn(
    async (data: ChatMessage) => await put("chat_message", data.id, toRaw(data)),
    300,
    { maxWait: 1000 }
  )
  const dbFindChatMessage = async (id: string) => await get<ChatMessage>("chat_message", id)
  /**
   * @description 删除对应的聊天组和聊天消息
   */
  const dbDelChatTopic = async (data: ChatTopic[]) => {
    return await request(async db => {
      const ts = db.transaction([storeKey.chat_message, storeKey.chat_topic], "readwrite")
      const storeTopic = ts.objectStore(storeKey.chat_topic)
      const storeMessage = ts.objectStore(storeKey.chat_message)
      data.forEach(item => {
        storeTopic.delete(item.id)
        if (item.chatMessageId) {
          storeMessage.delete(item.chatMessageId)
        }
      })
      return await wrapTransaction(ts)
    })
  }

  const getChatTopicContext = (topicId: string, modelId: string, provider: LLMProvider, message: ChatMessage) => {
    if (!llmChats[topicId]) {
      llmChats[topicId] = []
      llmChats[topicId].push({
        modelId: modelId,
        provider: markRaw(provider),
        message: message,
      })
      return llmChats[topicId][0]
    }
    const res = llmChats[topicId].find(item => item.modelId === modelId)
    if (!res) {
      llmChats[topicId].push({
        modelId: modelId,
        provider: markRaw(provider),
        message: message,
      })
      return llmChats[topicId].slice(-1)[0]
    }
    return res
  }

  /**
   * 获取消息上下文
   * @description 最后一个消息必须是`Role.User`,`DeepSeek-r1`要求消息必须是`Role.User`和`Role.Assistant`交替出现
   */
  const getMessageContext = (topic: ChatTopic, message: ChatMessage) => {
    const context: LLMChatMessage[] = []
    let sysTick = false
    for (let i = message.data.length - 1; i >= 0; i--) {
      const item = message.data[i]
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

  const send = async (topic: ChatTopic, message: ChatMessage) => {
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

    for (const modelId of topic.modelIds) {
      if (modelId.length == 0) {
        console.warn("[send] modelId is empty")
        continue
      }
      const model = modelsStore.find(modelId) // 模型元数据
      const providerMeta = providerMetas.value.find(item => item.name == model?.providerName) // 提供商元数据
      if (!(model && providerMeta)) {
        console.warn("[send] model or providerMeta not found", modelId)
        continue
      }
      const provider = providerStore.providerManager.getLLMProvider(model.providerName)
      if (!provider) {
        console.warn("[send] provider not found", model.providerName)
        continue
      }
      const chatContext = getChatTopicContext(topic.id, modelId, provider, message) // 获取聊天信息上下文
      if (!chatContext.provider) chatContext.provider = provider

      // 单个请求的消息
      const newMessage = reactive<ChatMessage["data"][number]>({
        id: uniqueId(),
        finish: false,
        status: 200,
        time: formatSecond(new Date()),
        content: { role: "assistant", content: "", reasoningContent: "" },
        modelId,
      })
      const context = getMessageContext(topic, message) // 消息上下文
      chatContext.message.data.push(newMessage)
      chatContext.handler = markRaw(
        chatContext.provider.chat(context, model, providerMeta, async msg => {
          newMessage.status = msg.status
          newMessage.reasoning = msg.reasoning
          newMessage.content.content += msg.data.map(item => item.content).join("")
          newMessage.content.reasoningContent += msg.data.map(item => item.reasoningContent).join("")
          if (msg.status == 206) {
            newMessage.finish = false
          } else if (msg.status == 200) {
            newMessage.finish = true
            console.log("done")
          } else {
            newMessage.finish = true
          }
        })
      )
    }
    topic.content = ""
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
        data && topicList.push(...assembleTopicTree(data))
      } else {
        const data = chatTopicDefault()
        topicList.push(...assembleTopicTree(data))
        for (const item of data) {
          await dbAdd("chat_topic", item)
        }
      }
    } catch (error) {
      console.error(`[fetch chat topic] ${(error as Error).message}`)
    }
  }
  fetch()
  return {
    topicList,
    chatMessage,
    llmChats,
    dbUpdateChatTopic,
    dbAddChatTopic,
    dbFindChatMessage,
    dbAddChatMessage,
    dbUpdateChatMessage,
    dbDelChatTopic,
    send,
  }
})
