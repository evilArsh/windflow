import useModelsStore from "@renderer/store/model"
import useKnowledgeStore from "@renderer/store/knowledge"
import {
  ChatTopic,
  ModelMeta,
  ProviderMeta,
  ChatMessage,
  ChatLLMConfig,
  ChatTTIConfig,
  Provider,
  ModelType,
  Role,
  Content,
  ChatMessageTree,
  BeforeRequestCallback,
  BeforeRequestParams,
  Message,
  ChatMessageType,
  ChatMessageContextFlag,
} from "@renderer/types"
import { useUtils } from "./utils"
import { useContext } from "./context"
import { useData } from "./api"
import { isArrayLength, isString, toNumber } from "@toolmain/shared"
import { defaultMessage } from "./default"
import { useRag } from "./rag"

export const useMsg = (
  chatMessage: Record<string, ChatMessageTree[]>,
  chatLLMConfig: Record<string, ChatLLMConfig>,
  chatTTIConfig: Record<string, ChatTTIConfig>
) => {
  const ctx = useContext()
  const modelsStore = useModelsStore()
  const knowledgeStore = useKnowledgeStore()
  const api = useData()
  const { t } = useI18n()
  const utils = useUtils(chatMessage, chatLLMConfig, chatTTIConfig)
  const rag = useRag()

  const llmHooks = (topic: ChatTopic, message: ChatMessage): BeforeRequestCallback => {
    return async (messages: Message[], model: ModelMeta, provider: ProviderMeta): Promise<BeforeRequestParams> => {
      let m = messages
      // rag service
      if (topic.knowledgeId) {
        const em = await knowledgeStore.getEmbeddingConfigById(topic.knowledgeId)
        if (em) {
          m = await rag.patch(topic.knowledgeId, message.id, em, messages)
        }
      }
      // mcp service
      const mcpServersIds = (await window.api.mcp.getTopicServers(topic.id)).data
      return {
        messages: m,
        model,
        provider,
        mcpServersIds,
      }
    }
  }
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
      let chatContext = ctx.findContext(topic.id, message.id)
      chatContext = chatContext ?? ctx.fetchTopicContext(topic.id, message.modelId, message.id, provider)
      if (!chatContext.provider) chatContext.provider = provider
      chatContext.handler?.terminate()
      topic.requestCount = Math.max(1, topic.requestCount + 1)
      const askMessage = messages.find(item => item.id === message.fromId)
      const cnf = utils.findChatTTIConfig(topic.id)
      chatContext.handler = await chatContext.provider.textToImage(
        { ...cnf, prompt: askMessage?.node.content.content },
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
    message: ChatMessage
  ) => {
    // message contexts, messages stack was sorted in descending order, the newest message is the first one
    const messageContext = ctx.getMessageContext(
      topic,
      utils
        .findChatMessage(topic.id)
        ?.map(utils.unwrapMessage)
        .slice(utils.getIndex(topic.id, message.parentId ?? message.id) + 1) ?? []
    )
    const chatContext =
      ctx.findContext(topic.id, message.id) ?? ctx.fetchTopicContext(topic.id, message.modelId, message.id, provider)
    if (!chatContext.provider) chatContext.provider = provider
    chatContext.handler?.terminate()
    topic.requestCount = Math.max(1, topic.requestCount + 1)
    chatContext.handler = await chatContext.provider.chat(
      messageContext,
      model,
      providerMeta,
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
              modelsStore.update(model)
            }
          }
          if (message.parentId) return // 多模型请求时不总结标题
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
        api.putChatMessage(message)
      },
      llmHooks(topic, message)
    )
  }

  const sendMessage = async (topic: ChatTopic, message: ChatMessage) => {
    const meta = utils.getMeta(message.modelId)
    if (!meta) {
      message.content.content = `[error when send message] unknown model id :${message.modelId}`
      return
    }
    const { model, providerMeta, provider } = meta
    if (modelsStore.utils.isChatType(model)) {
      return sendLLMMessage(topic, model, providerMeta, provider, message)
    } else if (
      modelsStore.utils.isImageType(model) ||
      modelsStore.utils.isVideoType(model) ||
      modelsStore.utils.isTTSType(model) ||
      modelsStore.utils.isASRType(model)
    ) {
      return sendMediaMessage(topic, model, providerMeta, provider, message)
    }
  }

  async function restart(topic: ChatTopic, message: ChatMessageTree) {
    ctx.initContext(topic.id)
    let messageN: ChatMessageTree = message
    // when click user message's restart button
    if (messageN.node.content.role === Role.User) {
      const dstMessage = utils.findMessageByFromIdField(topic.id, messageN.id)
      if (dstMessage) {
        terminate(topic, dstMessage)
        messageN = dstMessage
      } else {
        // already has a user message but the response message is not found
        return send(topic, messageN, {
          content: messageN.node.content.content,
        })
      }
    } else {
      terminate(topic, messageN)
    }
    utils.resetChatMessage(messageN)
    if (messageN.node.type === ChatMessageType.MULTIMODELS) {
      for (const child of messageN.children) {
        await sendMessage(topic, child.node)
      }
    } else {
      return sendMessage(topic, messageN.node)
    }
  }

  /**
   * @param topic send a message base on topic
   * @param userMessage if not set, create a new user message and do request, otherwise use the existing message
   */
  async function send(
    topic: ChatTopic,
    userMessage?: ChatMessageTree,
    config?: {
      content?: Content
      modelIds?: string[]
    }
  ) {
    const content = config?.content ?? topic.content
    const modelIds = config?.modelIds ?? topic.modelIds
    const withExistUser = !!userMessage
    if (withExistUser && userMessage.node.topicId !== topic.id) {
      throw new Error(t("error.messageNotInTopic"))
    }
    if (!modelIds.length) {
      throw new Error(t("error.emptyModels"))
    }
    const messages = utils.findChatMessage(topic.id)
    if (!messages) {
      throw new Error(t("error.noMessages"))
    }
    const userIndex = withExistUser ? userMessage.node.index : utils.findMaxMessageIndex(messages) + 1
    const userMsg: ChatMessageTree = withExistUser
      ? userMessage
      : reactive(
          utils.wrapMessage(
            utils.newChatMessage(topic.id, userIndex, {
              content: { role: Role.User, content: content },
              type: ChatMessageType.TEXT,
              contextFlag: ChatMessageContextFlag.PART,
            })
          )
        )
    const newMessage: ChatMessageTree = reactive(
      utils.wrapMessage(
        utils.newChatMessage(topic.id, userIndex + 1, {
          content: defaultMessage(),
          fromId: userMsg.id,
          type: ChatMessageType.TEXT,
          contextFlag: ChatMessageContextFlag.PART,
        })
      )
    )
    const availableModels = modelIds.filter(modelId => !!utils.getMeta(modelId))
    if (availableModels.length > 1) {
      userMsg.node.type = ChatMessageType.MULTIMODELS
      newMessage.node.type = ChatMessageType.MULTIMODELS
      availableModels.forEach((modelId, index) => {
        const message = utils.newChatMessage(topic.id, utils.findMaxMessageIndex(newMessage.children) + 1, {
          fromId: userMsg.id,
          parentId: newMessage.node.id,
          content: defaultMessage(),
          modelId,
          // first child message as the default context
          contextFlag: index == 0 ? ChatMessageContextFlag.PART : undefined,
        })
        const meta = utils.getMeta(modelId)
        if (meta) {
          message.type = utils.getMessageType(meta.model)
        } else {
          message.content.content = `unknown model id :${newMessage.node.modelId}`
        }
        newMessage.children.push(utils.wrapMessage(message))
      })
      await api.bulkPutChatMessage([userMsg.node, newMessage.node, ...newMessage.children.map(m => m.node)])
    } else {
      newMessage.node.modelId = availableModels[0]
      const meta = utils.getMeta(newMessage.node.modelId)
      if (!meta) {
        newMessage.node.content.content = `unknown model id :${newMessage.node.modelId}`
      } else {
        newMessage.node.type = utils.getMessageType(meta.model)
        userMsg.node.type = newMessage.node.type
      }
      await api.bulkPutChatMessage([userMsg.node, newMessage.node])
    }
    !withExistUser && messages.unshift(userMsg)
    if (withExistUser) {
      messages.splice(
        messages.findIndex(m => m.id === userMessage.id),
        0,
        newMessage
      )
    } else {
      messages.unshift(newMessage)
    }
    if (isArrayLength(newMessage.children)) {
      for (const child of newMessage.children) {
        await sendMessage(topic, child.node)
      }
    } else {
      await sendMessage(topic, newMessage.node)
    }
  }
  function terminate(topic: ChatTopic, message: ChatMessageTree) {
    const chatContext = ctx.findContext(topic.id, message.node.id)
    if (window.api) {
      window.api.rag.searchTerminate(message.id)
    }
    chatContext?.handler?.terminate()
    // TODO: stop rag searching
    message.children.forEach(child => terminate(topic, child))
  }
  /**
   * @description 终止当前topic中所有聊天块的请求
   */
  function terminateAll(topic: ChatTopic) {
    const message = utils.findChatMessage(topic.id)
    if (!message) return
    message.forEach(messageItem => {
      terminate(topic, messageItem)
    })
  }
  /**
   * removeContext
   */
  function removeContext(topicId: string, messageId?: string) {
    ctx.removeContext(topicId, messageId)
  }
  return {
    send,
    terminate,
    restart,
    terminateAll,
    removeContext,
  }
}
