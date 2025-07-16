import { defineStore, storeToRefs } from "pinia"
import {
  ChatLLMConfig,
  ChatMessage,
  ChatTopic,
  ChatTopicTree,
  ChatTTIConfig,
  ProviderMeta,
  Role,
} from "@renderer/types"
import useProviderStore from "@renderer/store/provider"
import useModelsStore from "@renderer/store/model"
import { useContext } from "./context"
import { useData } from "./data"
import { useUtils } from "./utils"
import { defaultTTIConfig, defaultLLMConfig, defaultLLMMessage } from "./default"

export default defineStore("chat_topic", () => {
  const providerStore = useProviderStore()
  const modelsStore = useModelsStore()
  const { providerMetas } = storeToRefs(providerStore)
  const { fetchTopicContext, getMessageContext, findContext, initContext } = useContext()
  const topicList = reactive<Array<ChatTopicTree>>([]) // 聊天组列表
  const chatMessage = reactive<Record<string, ChatMessage[]>>({}) // 聊天信息缓存,topicId作为key
  const chatLLMConfig = reactive<Record<string, ChatLLMConfig>>({}) // 聊天LLM配置,topicId作为key
  const chatTTIConfig = reactive<Record<string, ChatTTIConfig>>({}) // 聊天图片配置,topicId作为key
  const currentNodeKey = ref<string>("") // 选中的聊天节点key,和数据库绑定
  const api = useData(topicList, currentNodeKey)
  const utils = useUtils(chatMessage, chatLLMConfig, chatTTIConfig)

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
  const sendMessage = async (topic: ChatTopic, message: ChatMessage, parentMessageId?: string) => {
    const meta = getMeta(message.modelId)
    if (!meta) return
    const messages = utils.findChatMessage(topic.id)
    if (!messages) return
    const { model, providerMeta, provider } = meta
    let chatContext = findContext(topic.id, message.id)
    const messageContextIndex = messages.findIndex(item => item.id === (parentMessageId ? parentMessageId : message.id))
    // 消息上下文
    const messageContext = getMessageContext(topic, messages.slice(messageContextIndex + 1))
    // 获取聊天框上下文
    chatContext = chatContext ?? fetchTopicContext(topic.id, message.modelId, message.id, provider)
    if (!chatContext.provider) chatContext.provider = provider
    if (chatContext.handler) chatContext.handler.terminate()

    const mcpServersIds = (await window.api.mcp.getTopicServers(topic.id)).data
    topic.requestCount = Math.max(1, topic.requestCount + 1)
    chatContext.handler = await chatContext.provider.chat(
      messageContext,
      model,
      providerMeta,
      mcpServersIds,
      res => {
        const { data, status } = res
        message.completionTokens = toNumber(data.usage?.completion_tokens)
        message.promptTokens = toNumber(data.usage?.prompt_tokens)
        message.status = status
        message.content = data
        if (status == 206) {
          message.finish = false
        } else if (status == 200) {
          message.finish = true
          topic.requestCount = Math.max(0, topic.requestCount - 1)
          if (parentMessageId) return // 多模型请求时不总结标题
          if (topic.label === window.defaultTopicTitle && chatContext.provider) {
            chatContext.provider.summarize(JSON.stringify(message), model, providerMeta).then(res => {
              if (res) topic.label = res
            })
          }
        } else if (status == 100) {
          message.finish = false
        } else {
          message.finish = true
          topic.requestCount = Math.max(0, topic.requestCount - 1)
        }
        api.updateChatMessage(message)
      },
      utils.findChatLLMConfig(topic.id)
    )
  }
  /**
   * @description `parentMessageDataId`存在时，表示restart子聊天；否则表示restart父聊天或者restart所有子聊天；
   * 当子聊天存在时，父聊天不存在实际的请求，只是一个壳
   */
  function restart(topic: ChatTopic, messageId: string, parentMessageId?: string) {
    initContext(topic.id)
    terminate(topic, messageId, parentMessageId)
    const messages = utils.findChatMessage(topic.id)
    if (!messages) {
      console.warn(`[restart] message not found.topic id:${topic.id}`)
      return
    }
    const [message, _] = utils.findChatMessageChild(topic.id, messageId, parentMessageId)
    if (!message) {
      console.warn(`[restart] message not found.${messageId}`)
      return
    }
    if (!parentMessageId && message.children && message.children.length) {
      message.children.forEach(child => {
        restart(topic, child.id, message.id)
      })
    } else {
      message.content = defaultLLMMessage()
      message.finish = false
      message.status = 100
      message.createAt = Date.now()
      sendMessage(topic, message, parentMessageId)
    }
  }
  async function send(topic: ChatTopic) {
    if (!topic.content.trim()) return
    if (topic.modelIds.length == 0) return
    const messages = utils.findChatMessage(topic.id)
    if (!messages) {
      console.error("[send] message not found")
      return
    }
    const newUserMessage = utils.newChatMessage(topic.id, messages.length, {
      content: { role: Role.User, content: topic.content },
    })
    await api.addChatMessage(newUserMessage)
    messages.unshift(newUserMessage)

    const newMessage = reactive(
      utils.newChatMessage(topic.id, messages.length, {
        content: defaultLLMMessage(),
      })
    )
    const availableModels = topic.modelIds.filter(modelId => getMeta(modelId))
    if (availableModels.length > 1) {
      availableModels.forEach(modelId => {
        if (!newMessage.children) newMessage.children = []
        newMessage.children.push(
          utils.newChatMessage(topic.id, newMessage.children.length, {
            parentId: newMessage.id,
            content: defaultLLMMessage(),
            modelId,
          })
        )
      })
    } else {
      newMessage.modelId = availableModels[0]
    }
    await api.addChatMessage(newMessage)
    messages.unshift(newMessage)
    if (newMessage.children && newMessage.children.length) {
      newMessage.children.forEach(child => {
        sendMessage(topic, child, newMessage.id)
      })
    } else {
      sendMessage(topic, newMessage)
    }
    topic.content = ""
    await api.updateChatTopic(topic)
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
    const [message, _] = utils.findChatMessageChild(topic.id, messageDataId, parentMessageDataId)
    if (!message) return
    const chatContext = findContext(topic.id, message.id)
    chatContext?.handler?.terminate()
    if (isArray(message.children)) {
      message.children.forEach(child => {
        const chatContext = findContext(topic.id, child.id)
        chatContext?.handler?.terminate()
      })
    }
  }
  /**
   * @description 终止当前topic中所有聊天块的请求
   */
  function terminateAll(topic: ChatTopic) {
    const message = utils.findChatMessage(topic.id)
    if (!message) return
    message.forEach(messageItem => {
      terminate(topic, messageItem.id)
    })
  }
  /**
   * @description 删除一条消息列表的消息
   */
  async function deleteMessage(topic: ChatTopic, messageId: string, parentMessageId?: string) {
    const messages = utils.findChatMessage(topic.id)
    if (!messages) return
    terminate(topic, messageId, parentMessageId)
    const [message, index] = utils.findChatMessageChild(topic.id, messageId, parentMessageId)
    if (message && index > -1) {
      if (parentMessageId) {
        message.children?.splice(index, 1)
        if (!message.children?.length) {
          const [_, index] = utils.findChatMessageChild(topic.id, messageId)
          if (index >= 0) {
            messages.splice(index, 1)
            await api.deleteChatMessage(messageId)
          }
        } else {
          await api.updateChatMessage(message)
        }
      } else {
        messages.splice(index, 1)
        await api.deleteChatMessage(messageId)
      }
    } else {
      console.warn(
        "[deleteMessage]",
        `cannot find child messageDataId: ${messageId} in parent messageDataId: ${parentMessageId}`
      )
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
  return {
    topicList,
    chatMessage,
    currentNodeKey,
    chatTTIConfig,
    chatLLMConfig,
    terminate,
    deleteMessage,
    restart,
    send,
    refreshChatTopicModelIds,
    terminateAll,
    loadChatTopicData,
    api,
    utils,
  }
})
