import { defineStore } from "pinia"
import {
  ChatLLMConfig,
  ChatMessage,
  ChatTopic,
  ChatTopicTree,
  ChatTTIConfig,
  Content,
  ModelMeta,
  ModelType,
  Provider,
  ProviderMeta,
  Role,
  SettingKeys,
} from "@renderer/types"
import useSettingsStore from "@renderer/store/settings"
import useModelsStore from "@renderer/store/model"
import { useContext } from "./context"
import { useData } from "./api"
import { useUtils } from "./utils"
import { defaultTTIConfig, defaultLLMConfig, defaultMessage } from "./default"
import { toNumber, isString, uniqueId, isArray } from "@toolmain/shared"

export default defineStore("chat_topic", () => {
  const modelsStore = useModelsStore()
  const { fetchTopicContext, getMessageContext, findContext, initContext } = useContext()
  const { t } = useI18n()
  const topicList = reactive<Array<ChatTopicTree>>([]) // 聊天组列表
  const chatMessage = reactive<Record<string, ChatMessage[]>>({}) // 聊天信息缓存,topicId作为key
  const chatLLMConfig = reactive<Record<string, ChatLLMConfig>>({}) // 聊天LLM配置,topicId作为key
  const chatTTIConfig = reactive<Record<string, ChatTTIConfig>>({}) // 聊天图片配置,topicId作为key
  const currentNodeKey = ref<string>("") // 选中的聊天节点key,和数据库绑定
  const api = useData()
  const settingsStore = useSettingsStore()
  const utils = useUtils(chatMessage, chatLLMConfig, chatTTIConfig)

  const sendMediaMessage = async (
    topic: ChatTopic,
    model: ModelMeta,
    providerMeta: ProviderMeta,
    provider: Provider,
    message: ChatMessage
  ) => {
    const messages = utils.findChatMessage(topic.id)
    if (!messages) return
    if (modelsStore.utils.isImageType(model)) {
      message.status = 100
      let chatContext = findContext(topic.id, message.id)
      chatContext = chatContext ?? fetchTopicContext(topic.id, message.modelId, message.id, provider)
      if (!chatContext.provider) chatContext.provider = provider
      chatContext.handler?.terminate()
      topic.requestCount = Math.max(1, topic.requestCount + 1)
      const askMessage = messages.find(item => item.id === message.fromId)
      const cnf = utils.findChatTTIConfig(topic.id)
      chatContext.handler = await chatContext.provider.textToImage(
        { ...cnf, prompt: askMessage?.content.content },
        model,
        providerMeta,
        res => {
          message.content = res.data
          message.finish = true
          message.status = res.status
          message.msg = res.msg
          topic.requestCount = Math.max(0, topic.requestCount - 1)
        }
      )
    } else {
      console.log("[media request not implement]", model, provider)
      message.finish = true
      message.status = 200
      message.content.content = "暂未支持，敬请期待"
      topic.requestCount = Math.max(0, topic.requestCount - 1)
    }
  }
  const sendLLMMessage = async (
    topic: ChatTopic,
    model: ModelMeta,
    providerMeta: ProviderMeta,
    provider: Provider,
    message: ChatMessage,
    parentMessageId?: string
  ) => {
    const messages = utils.findChatMessage(topic.id)
    if (!messages) return
    // 多个模型同时聊天时，父消息的children在请求
    const messageParent = parentMessageId ? utils.findChatMessageChild(topic.id, parentMessageId)[0] : undefined
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
      value => {
        const { data, status, msg } = value
        message.completionTokens = data.children?.reduce((acc, cur) => acc + toNumber(cur.usage?.completion_tokens), 0)
        message.promptTokens = data.children?.reduce((acc, cur) => acc + toNumber(cur.usage?.prompt_tokens), 0)
        message.status = status
        message.content = data
        message.msg = msg
        if (status == 206) {
          message.finish = false
        } else if (status == 200) {
          message.finish = true
          topic.requestCount = Math.max(0, topic.requestCount - 1)
          if (message.content.children?.some(child => !!child.reasoning_content)) {
            if (!modelsStore.utils.isChatReasonerType(model)) {
              model.type.push(ModelType.ChatReasoner)
              modelsStore.api.update(model)
            }
          }
          if (parentMessageId) return // 多模型请求时不总结标题
          if (topic.label === window.defaultTopicTitle && chatContext.provider) {
            chatContext.provider.summarize(JSON.stringify(message), model, providerMeta, value => {
              if (isString(value.data.content)) {
                topic.label = value.data.content
                api.putChatTopic(topic)
              }
            })
          }
        } else if (status == 100) {
          message.finish = false
        } else {
          message.finish = true
          topic.requestCount = Math.max(0, topic.requestCount - 1)
        }
        api.putChatMessage(messageParent ?? message)
      },
      utils.findChatLLMConfig(topic.id)
    )
  }
  /**
   * @description 发送消息，当`parentMessageDataId`存在时，`messageData`为其子消息
   */
  const sendMessage = async (topic: ChatTopic, message: ChatMessage, parentMessageId?: string) => {
    const meta = utils.getMeta(message.modelId)
    if (!meta) {
      message.content.content = `unknown model id :${message.modelId}`
      return
    }
    const messages = utils.findChatMessage(topic.id)
    if (!messages) return
    const { model, providerMeta, provider } = meta
    if (modelsStore.utils.isChatType(model)) {
      return sendLLMMessage(topic, model, providerMeta, provider, message, parentMessageId)
    } else if (
      modelsStore.utils.isImageType(model) ||
      modelsStore.utils.isVideoType(model) ||
      modelsStore.utils.isTTSType(model) ||
      modelsStore.utils.isASRType(model)
    ) {
      return sendMediaMessage(topic, model, providerMeta, provider, message)
    }
  }
  /**
   * @description `parentMessageId`存在时，表示restart多模型回答模式下的其中一个子聊天；
   * 否则表示restart单模型或多模型回答模式下的所有子聊天；
   * 多模型回答模式下，父message不存在实际的请求
   */
  async function restart(topic: ChatTopic, messageId: string, parentMessageId?: string) {
    initContext(topic.id)
    const messages = utils.findChatMessage(topic.id)
    if (!messages) {
      console.warn(`[restart] message not found.topic id:${topic.id}`)
      return
    }
    let message: ChatMessage | undefined
    const [m, _] = utils.findChatMessageChild(topic.id, messageId, parentMessageId)
    if (!m) {
      console.warn(`[restart] message not found.${messageId}`)
      return
    }
    message = m
    if (message.content.role === Role.User) {
      const dstMessage = messages.find(val => val.fromId === message?.id)
      if (dstMessage) {
        terminate(topic, dstMessage.id)
        message = dstMessage
      } else {
        return send(topic, message, {
          content: message.content.content,
        })
      }
    } else {
      terminate(topic, message.id, parentMessageId)
    }
    utils.resetChatMessage(message)
    if (!parentMessageId && message.children?.length) {
      for (const child of message.children) {
        await sendMessage(topic, child, message.id)
      }
    } else {
      return sendMessage(topic, message, parentMessageId)
    }
  }
  async function send(
    topic: ChatTopic,
    userMessage?: ChatMessage,
    config?: {
      content?: Content
      modelIds?: string[]
    }
  ) {
    const content = config?.content ?? topic.content
    const modelIds = config?.modelIds ?? topic.modelIds
    const withExistUser = !!userMessage
    if (withExistUser && userMessage.topicId !== topic.id) {
      throw new Error(t("error.messageNotInTopic"))
    }
    if (!modelIds.length) {
      throw new Error(t("error.emptyModels"))
    }
    const messages = utils.findChatMessage(topic.id)
    if (!messages) {
      throw new Error(t("error.noMessages"))
    }
    const userIndex = withExistUser ? userMessage.index : messages.length
    const userMsg = withExistUser
      ? userMessage
      : reactive(
          utils.newChatMessage(topic.id, userIndex, {
            content: { role: Role.User, content: content },
          })
        )
    const newMessage = reactive(
      utils.newChatMessage(topic.id, userIndex + 1, {
        content: defaultMessage(),
        fromId: userMsg.id,
      })
    )
    const availableModels = modelIds.filter(modelId => !!utils.getMeta(modelId))
    if (availableModels.length > 1) {
      userMsg.type = "multi-models"
      newMessage.type = "multi-models"
      availableModels.forEach(modelId => {
        if (!newMessage.children) newMessage.children = []
        const message = utils.newChatMessage(topic.id, newMessage.children.length, {
          parentId: newMessage.id,
          content: defaultMessage(),
          modelId,
          fromId: userMsg.id,
        })
        const meta = utils.getMeta(modelId)
        if (meta) {
          message.type = utils.getMessageType(meta.model)
        } else {
          message.content.content = `unknown model id :${newMessage.modelId}`
        }
        newMessage.children.push(message)
      })
    } else {
      newMessage.modelId = availableModels[0]
      const meta = utils.getMeta(newMessage.modelId)
      if (!meta) {
        newMessage.content.content = `unknown model id :${newMessage.modelId}`
      } else {
        newMessage.type = utils.getMessageType(meta.model)
        userMsg.type = newMessage.type
      }
    }
    await api.putChatMessage(toRaw(userMsg))
    !withExistUser && messages.unshift(userMsg)
    await api.putChatMessage(toRaw(newMessage))
    if (withExistUser) {
      messages.splice(
        messages.findIndex(m => m.id === userMessage.id),
        0,
        newMessage
      )
    } else {
      messages.unshift(newMessage)
    }
    if (newMessage.children?.length) {
      for (const child of newMessage.children) {
        await sendMessage(topic, child, newMessage.id)
      }
    } else {
      await sendMessage(topic, newMessage)
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
    if (!message) {
      console.warn(
        "[deleteMessage]",
        `cannot find child messageDataId: ${messageId} in parent messageDataId: ${parentMessageId}`
      )
      return
    }
    if (parentMessageId) {
      const [parentMessage, parentIndex] = utils.findChatMessageChild(topic.id, parentMessageId)
      if (!parentMessage) return
      parentMessage.children?.splice(index, 1)
      if (!parentMessage.children?.length) {
        messages.splice(parentIndex, 1)
        await api.deleteChatMessage(parentMessageId)
      } else {
        await api.putChatMessage(parentMessage)
      }
    } else {
      messages.splice(index, 1)
      await api.deleteChatMessage(messageId)
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
  async function init() {
    topicList.length = 0
    const res = await api.fetch()
    topicList.push(...res)
    // --- 恢复状态
    const nodeKeyData = await settingsStore.get<string>(SettingKeys.ChatCurrentNodeKey, "")
    currentNodeKey.value = nodeKeyData ? nodeKeyData.value : ""
  }
  return {
    init,

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
