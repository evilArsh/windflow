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
  const { fetchTopicContext, getMessageContext, findContext, initContext } = useContext()
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
   * @description 发送消息，当`parentMessageDataId`存在时，`messageData`为其子消息
   */
  const sendMessage = async (
    topic: ChatTopic,
    message: ChatMessage,
    messageData: ChatMessageData,
    parentMessageDataId?: string
  ) => {
    api.updateChatMessage(message)
    const meta = getMeta(messageData.modelId)
    if (!meta) return
    const { model, providerMeta, provider } = meta
    let chatContext = findContext(topic.id, messageData.id)
    const messageContextIndex = message.data.findIndex(
      item => item.id === (parentMessageDataId ? parentMessageDataId : messageData.id)
    )
    // 消息上下文
    const messageContext = getMessageContext(topic, message.data.slice(messageContextIndex + 1))
    // 获取聊天框上下文
    chatContext = chatContext ?? fetchTopicContext(topic.id, messageData.modelId, messageData.id, message.id, provider)
    if (!chatContext.provider) chatContext.provider = provider
    if (chatContext.handler) chatContext.handler.terminate()

    const mcpServersIds = topic.mcpServers.filter(v => !v.disabled).map(v => v.id)
    topic.requestCount = Math.max(1, topic.requestCount + 1)
    chatContext.handler = await chatContext.provider.chat(messageContext, model, providerMeta, mcpServersIds, res => {
      const { data, status } = res
      messageData.completionTokens = toNumber(data.usage?.completion_tokens)
      messageData.promptTokens = toNumber(data.usage?.prompt_tokens)
      messageData.status = status
      messageData.content = data
      if (status == 206) {
        messageData.finish = false
      } else if (status == 200) {
        messageData.finish = true
        topic.requestCount = Math.max(0, topic.requestCount - 1)
        if (parentMessageDataId) return // 多模型请求时不总结标题
        if (topic.label === window.defaultTopicTitle && chatContext.provider) {
          chatContext.provider.summarize(JSON.stringify(messageData), model, providerMeta).then(res => {
            if (res) topic.label = res
          })
        }
      } else if (status == 100) {
        messageData.finish = false
      } else {
        messageData.finish = true
        topic.requestCount = Math.max(0, topic.requestCount - 1)
      }
      api.updateChatMessage(message)
    })
  }
  /**
   * @description `parentMessageDataId`存在时，表示restart子聊天；否则表示restart父聊天或者restart所有子聊天；
   * 当子聊天存在时，父聊天不存在实际的请求，只是一个壳
   */
  function restart(topic: ChatTopic, messageDataId: string, parentMessageDataId?: string) {
    if (!topic.chatMessageId) return
    initContext(topic.id)
    terminate(topic, messageDataId, parentMessageDataId)
    const message = utils.findChatMessage(topic.chatMessageId)
    if (!message) {
      console.warn(`[restart] message not found.${topic.chatMessageId}`)
      return
    }
    const [messageData, _] = utils.findChatMessageChild(message.id, messageDataId, parentMessageDataId)
    if (!messageData) {
      console.warn(`[restart] messageItem not found.${messageDataId}`)
      return
    }
    if (!parentMessageDataId && isArray(messageData.children) && messageData.children.length > 0) {
      messageData.children.forEach(child => {
        restart(topic, child.id, messageData.id)
      })
    } else {
      messageData.content = defaultLLMMessage()
      messageData.finish = false
      messageData.status = 100
      messageData.time = formatSecond(new Date())
      sendMessage(topic, message, messageData, parentMessageDataId)
    }
  }
  function send(topic: ChatTopic) {
    if (!topic.content.trim()) return
    if (topic.modelIds.length == 0) return
    if (!topic.chatMessageId) {
      console.error("[send] topic.chatMessageId is empty")
      return
    }
    const message = utils.findChatMessage(topic.chatMessageId)
    if (!message) {
      console.error("[send] message not found")
      return
    }
    const id = uniqueId()
    message.data.unshift({
      id,
      status: 200,
      time: formatSecond(new Date()),
      finish: true,
      content: { role: Role.User, content: topic.content },
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
    const availableModels = topic.modelIds.filter(modelId => getMeta(modelId))
    if (availableModels.length > 1) {
      availableModels.forEach(modelId => {
        newMessageData.children!.push({
          id: uniqueId(),
          parentId: newMessageData.id,
          status: 200,
          content: defaultLLMMessage(),
          modelId,
          time: formatSecond(new Date()),
        })
      })
    } else {
      newMessageData.modelId = availableModels[0]
    }
    message.data.unshift(newMessageData)
    if (newMessageData.children && newMessageData.children.length > 0) {
      newMessageData.children.forEach(child => {
        sendMessage(topic, message, child, newMessageData.id)
      })
    } else {
      sendMessage(topic, message, newMessageData)
    }
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

  function terminate(topic: ChatTopic, messageDataId: string, parentMessageDataId?: string) {
    const [messageData, _] = utils.findChatMessageChildByTopic(topic, messageDataId, parentMessageDataId)
    if (!messageData) return
    const chatContext = findContext(topic.id, messageData.id)
    chatContext?.handler?.terminate()
    if (isArray(messageData.children)) {
      messageData.children.forEach(child => {
        const chatContext = findContext(topic.id, child.id)
        chatContext?.handler?.terminate()
      })
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
  async function deleteSubMessage(topic: ChatTopic, messageDataId: string, parentMessageDataId?: string) {
    try {
      if (!topic.chatMessageId) {
        console.warn(`[deleteSubMessage] topic.chatMessageId is empty.`)
        return
      }
      const message = utils.findChatMessage(topic.chatMessageId)
      if (!message) return
      terminate(topic, messageDataId, parentMessageDataId)
      if (parentMessageDataId) {
        const [parentMessageData, parentIndex] = utils.findChatMessageChild(message.id, parentMessageDataId)
        const [messageData, index] = utils.findChatMessageChild(message.id, messageDataId, parentMessageDataId)
        console.log("[delete sub message]", messageData)
        if (parentMessageData && index > -1 && parentIndex > -1) {
          parentMessageData.children?.splice(index, 1)
          if (parentMessageData.children?.length === 0) {
            console.log("[delete sub message] sub is empty, delete parent")
            message.data.splice(parentIndex, 1)
          }
        } else {
          console.warn(
            "[deleteSubMessage]",
            `cannot find child messageDataId: ${messageDataId} in parent messageDataId: ${parentMessageDataId}`
          )
        }
      } else {
        const [messageData, index] = utils.findChatMessageChild(message.id, messageDataId)
        if (index == -1) return
        console.log("[delete sub message]", messageData)
        message.data.splice(index, 1)
      }
    } catch (error) {
      console.log("[deleteSubMessage error]", error)
    }
  }
  return {
    topicList,
    chatMessage,
    currentNodeKey,
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
