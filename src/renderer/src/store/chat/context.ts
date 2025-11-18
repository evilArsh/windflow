import {
  ChatContext,
  ChatMessage,
  ChatMessageContextFlag,
  ChatMessageType,
  ChatTopic,
  Message,
  Provider,
  Role,
} from "@renderer/types"
import { isArrayLength, isNumber, toNumber } from "@toolmain/shared"

export const useContext = () => {
  // 文本聊天请求缓存, 切换聊天时，继续请求,使用topicId作为key
  const llmChats = reactive<Record<string, ChatContext[]>>({})
  /**
   * @description 获取上下文，如果不存在则创建一个，messageDataId可能是子对话id
   */
  const fetchTopicContext = (topicId: string, modelId: string, messageId: string, provider: Provider) => {
    if (!llmChats[topicId]) {
      llmChats[topicId] = []
      llmChats[topicId].push({ modelId, provider, messageId })
      return llmChats[topicId][0]
    }
    const res = llmChats[topicId].find(item => item.messageId === messageId)
    if (!res) {
      llmChats[topicId].push({ modelId, provider, messageId })
      return llmChats[topicId].slice(-1)[0]
    } else {
      if (!res.provider) {
        res.provider = provider
      }
    }
    return res
  }

  /**
   * @param rawMessages sort in descending order by create time
   */
  const getMessageContext = (topic: ChatTopic, rawMessages: ChatMessage[]) => {
    const maxContextLength = Math.max(1, toNumber(topic.maxContextLength))
    const boundaryIndex = rawMessages.findIndex(item => item.contextFlag === ChatMessageContextFlag.BOUNDARY)
    const messages = rawMessages.slice(0, Math.max(0, boundaryIndex))
    const extractData = (data: Message): Message => ({ role: data.role, content: data.content })
    const getFirstContext = (contexts: Message[]) => (contexts.length ? contexts[0] : undefined)
    let userTurn = true
    let contexts: Message[] = []
    // const lastUserAsk = messages.shift()
    // if (lastUserAsk && lastUserAsk.content.role === Role.User) {
    //   contexts.unshift(extractData(lastUserAsk.content))
    //   userTurn = false
    // }
    // const messages = messages.filter(msg => !msg.type || msg.type === ChatMessageType.TEXT)
    let current: ChatMessage | undefined
    while (true) {
      current = messages.shift()
      if (!current) {
        // if (userTurn) {
        //   // user-assistant消息pair中，无user消息，此时删除assistant消息
        //   if (contexts.length > 0 && contexts[0].role === Role.Assistant) contexts.shift()
        // }
        // the first context is user message
        if (getFirstContext(contexts)?.role === Role.Assistant) contexts.shift()
        break
      }
      if (userTurn) {
        if (current.content.role === Role.User) {
          contexts.unshift(extractData(current.content))
          userTurn = false
        } else {
          // 丢弃上下文,`DeepSeek-r1`要求消息必须是`Role.User`和`Role.Assistant`交替出现
          if (getFirstContext(contexts)?.role === Role.Assistant) contexts.shift()
        }
      } else {
        if (current.content.role == Role.Assistant) {
          contexts.unshift({
            role: current.content.role,
            content: current.content.children?.map(item => item.content as string).join("\n") ?? "",
          })
          userTurn = true
        } else {
          // drop
        }
      }
    }
    if (maxContextLength > -1 && contexts.length > maxContextLength) {
      contexts = contexts.slice(contexts.length - maxContextLength)
      if (contexts.length > 0 && contexts[0].role === Role.Assistant) contexts.shift()
    }
    contexts.unshift({ role: Role.System, content: JSON.stringify({ type: "text", content: topic.prompt }) })
    return contexts
  }
  function hasTopic(topicId: string) {
    return !!llmChats[topicId]
  }
  function findContext(topicId: string, messageId: string): ChatContext | undefined {
    if (hasTopic(topicId)) {
      return llmChats[topicId].find(item => item.messageId === messageId)
    }
    return undefined
  }
  function findTopicContext(topicId: string): ChatContext[] | undefined {
    return llmChats[topicId]
  }
  function initContext(topicId: string) {
    if (!llmChats[topicId]) {
      llmChats[topicId] = []
    }
  }
  function removeContext(topicId: string, messageId?: string) {
    if (!llmChats[topicId]) return
    if (messageId) {
      const index = llmChats[topicId].findIndex(item => item.messageId === messageId)
      llmChats[topicId].splice(index, 1)
    } else {
      delete llmChats[topicId]
    }
  }

  return {
    fetchTopicContext,
    getMessageContext,
    hasTopic,
    findContext,
    findTopicContext,
    initContext,
    removeContext,
  }
}
