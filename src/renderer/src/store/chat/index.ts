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
import { useContext } from "./context"
import { useData } from "./data"
import { useUtils } from "./utils"

export default defineStore("chat_topic", () => {
  const providerStore = useProviderStore()
  const modelsStore = useModelsStore()
  const { providerMetas } = storeToRefs(providerStore)
  const { fetchTopicContext, getMessageContext, mountContext, findContext, initContext } = useContext()
  const topicList = reactive<Array<ChatTopicTree>>([]) // 聊天组列表
  const chatMessage = reactive<Record<string, ChatMessage>>({}) // 聊天信息缓存,messageId作为key
  const currentNodeKey = ref<string>("") // 选中的聊天节点key,和数据库绑定
  const api = useData(topicList, chatMessage, currentNodeKey)
  const utils = useUtils(topicList, chatMessage, currentNodeKey)

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
          if (topic.label === window.defaultTopicTitle && chatContext.provider) {
            chatContext.provider.summarize(JSON.stringify(messageItem), model, providerMeta).then(res => {
              if (res) topic.label = res
            })
          }
        } else if (status == 100) {
          messageItem.finish = false
        } else {
          messageItem.finish = true
          topic.requestCount = Math.max(0, topic.requestCount - 1)
        }
        api.updateChatMessage(message)
      })
    }
  }
  function restart(topic: ChatTopic, messageDataId: string) {
    if (!topic.chatMessageId) return
    initContext(topic.id)
    const message = utils.findChatMessage(topic.chatMessageId)
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
  function send(topic: ChatTopic) {
    if (!topic.content.trim()) return
    if (topic.modelIds.length == 0) return
    if (!topic.chatMessageId) {
      console.warn("[send] topic.chatMessageId is empty")
      return
    }
    const message = utils.findChatMessage(topic.chatMessageId)
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
    api.updateChatTopic(topic)
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

  function terminate(topic: ChatTopic, messageDataId: string) {
    const [messageItem, _] = utils.findChatMessageChildByTopic(topic, messageDataId)
    if (!messageItem) return
    const chatContext = findContext(topic.id, messageItem.id)
    chatContext?.handler?.terminate()
    if (messageItem.content.role === Role.Assistant) {
      if (Array.isArray(messageItem.children)) {
        messageItem.children.forEach(child => {
          const chatContext = findContext(topic.id, child.id)
          chatContext?.handler?.terminate()
        })
      }
    }
  }
  /**
   * @description 终止当前topic中所有聊天块的请求
   */
  function terminateAll(topic: ChatTopic) {
    if (!topic.chatMessageId) return
    const message = utils.findChatMessage(topic.chatMessageId)
    if (!message) return
    message.data.forEach(messageItem => {
      terminate(topic, messageItem.id)
    })
  }
  /**
   * @description 删除一条消息列表的消息
   */
  async function deleteSubMessage(topic: ChatTopic, messageDataId: string) {
    try {
      if (!topic.chatMessageId) {
        console.warn(`[deleteSubMessage] topic.chatMessageId is empty.`)
        return
      }
      const message = utils.findChatMessage(topic.chatMessageId)
      if (!message) return
      terminate(topic, messageDataId)
      const [_, index] = utils.findChatMessageChild(message.id, messageDataId)
      if (index == -1) return
      message.data.splice(index, 1)
    } catch (error) {
      console.log("[deleteSubMessage error]", error)
    }
  }
  return {
    topicList,
    chatMessage,
    currentNodeKey,
    mountContext,
    terminate,
    deleteSubMessage,
    restart,
    send,
    refreshChatTopicModelIds,
    terminateAll,
    api,
    utils,
  }
})
