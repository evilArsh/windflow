import { defineStore, storeToRefs } from "pinia"
import {
  ChatMessage,
  ChatMessageData,
  ChatTopic,
  ChatTopicTree,
  defaultLLMMessage,
  ProviderMeta,
  Role,
} from "@renderer/types"
import useProviderStore from "@renderer/store/provider"
import useModelsStore from "@renderer/store/model"
import { CallBackFn } from "@renderer/lib/shared/types"
import { useContext } from "./context"
import { useData } from "./data"

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
    const provider = providerStore.providerManager.getProvider(model.providerName)
    if (!provider) {
      console.warn("[getMeta] provider not found", model.providerName)
      return
    }
    return { model, providerMeta, provider }
  }
  /**
   * @description 发送消息
   */
  const sendMessage = async (topic: ChatTopic, message: ChatMessage, messageParent: ChatMessageData) => {
    api.updateChatMessage(message)
    const messageGroup =
      isArray(messageParent.children) && messageParent.children.length > 0 ? messageParent.children : [messageParent]
    for (const messageItem of messageGroup) {
      const meta = getMeta(messageItem.modelId)
      if (!meta) return
      const { model, providerMeta, provider } = meta
      let chatContext = findContext(topic.id, messageItem.id)
      const messageContextIndex = message.data.findIndex(item => item.id === messageParent.id)
      // 消息上下文
      const messageContext = getMessageContext(topic, message.data.slice(messageContextIndex + 1))
      messageItem.content = defaultLLMMessage()
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
      chatContext.handler = await chatContext.provider.chat(messageContext, model, providerMeta, mcpServersIds, res => {
        const { data, status } = res
        messageItem.completionTokens = toNumber(data.usage?.completion_tokens)
        messageItem.promptTokens = toNumber(data.usage?.prompt_tokens)
        messageItem.status = status
        messageItem.content = data
        if (status == 206) {
          messageItem.finish = false
        } else if (status == 200) {
          messageItem.finish = true
          topic.requestCount = Math.max(0, topic.requestCount - 1)
          // console.log(`[message done] ${status}`)
          if (topic.label === window.defaultTopicTitle && chatContext.provider) {
            chatContext.provider.summarize(JSON.stringify(messageItem), model, providerMeta).then(res => {
              if (res) topic.label = res
            })
          }
        } else if (status == 100) {
          messageItem.finish = false
          // console.log(`[message pending] ${status}`)
        } else {
          messageItem.finish = true
          topic.requestCount = Math.max(0, topic.requestCount - 1)
          // console.log(`[message] ${status}`)
        }
        api.updateChatMessage(message)
      })
    }
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
    message.data.unshift({
      id,
      status: 200,
      time: formatSecond(new Date()),
      finish: true,
      content: { role: "user", content: topic.content },
      modelId: "",
    })
    const newMessageData = reactive<ChatMessageData>({
      id: uniqueId(),
      status: 200,
      content: defaultLLMMessage(),
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
            content: defaultLLMMessage(),
            modelId,
            time: formatSecond(new Date()),
          })
        )
      })
    } else {
      newMessageData.modelId = availiableModels[0]
    }
    message.data.unshift(newMessageData)
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
      console.warn(`[deleteSubMessage] message or currentId or topic is empty.`, topic, message, currentId)
      return
    }
    const msgIndex = message.data.findIndex(item => item.id === currentId)
    if (isIndexOutOfRange(msgIndex, message.data.length)) {
      console.warn(`[deleteSubMessage] cann't find message.${msgIndex},${currentId}`)
      return
    }
    const current = message.data[msgIndex]
    const chatContext = findContext(topic.id, current.id)
    chatContext?.handler?.terminate()
    if (current.content.role === Role.Assistant) {
      if (Array.isArray(current.children)) {
        current.children.forEach(child => {
          const chatContext = findContext(topic.id, child.id)
          chatContext?.handler?.terminate()
        })
      }
    }
    message.data.splice(msgIndex, 1)
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
