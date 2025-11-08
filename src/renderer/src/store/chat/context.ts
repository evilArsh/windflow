import { ChatContext, ChatMessage, ChatTopic, Message, Provider, Role } from "@renderer/types"
import { isNumber } from "@toolmain/shared"

export const useContext = () => {
  // 文本聊天请求缓存, 切换聊天时，继续请求,使用topicId作为key
  const llmChats = reactive<Record<string, ChatContext[]>>({})
  /**
   * @description 获取上下文，如果不存在则创建一个，messageDataId可能是子对话id
   */
  const fetchTopicContext = (topicId: string, modelId: string, messageId: string, provider: Provider) => {
    if (!llmChats[topicId]) {
      llmChats[topicId] = []
      llmChats[topicId].push({
        modelId: modelId,
        provider: markRaw(provider),
        messageId: messageId,
      })
      return llmChats[topicId][0]
    }
    const res = llmChats[topicId].find(item => item.messageId === messageId)
    if (!res) {
      llmChats[topicId].push({
        modelId: modelId,
        provider: markRaw(provider),
        messageId: messageId,
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
   * mcp调用中存在{tool_calls:[]}和{tool_call_id:""},存在`item.toolCallsChain`中，
   * 提交时作为消息上下文
   *
   * messages 按照生成时间【倒序】排序
   *
   * TODO: 中间有删除消息时,删除与之配对的`Role.Assistant`或者`Role.User`消息
   */
  const getMessageContext = (topic: ChatTopic, messages: ChatMessage[]) => {
    const extractData = (data: Message): Message => {
      return {
        role: data.role,
        content: data.content,
      }
    }
    const lastUserAsk = messages.shift()
    let userTurn = true
    let context: Message[] = []
    if (lastUserAsk && lastUserAsk.content.role === Role.User) {
      context.unshift(extractData(lastUserAsk.content))
      userTurn = false
    }
    const filteredMessage = messages.filter(msg => !msg.type || msg.type === "text")
    const maxContextLength = isNumber(topic.maxContextLength)
      ? topic.maxContextLength >= 0
        ? Math.max(1, topic.maxContextLength)
        : topic.maxContextLength
      : 7
    let data: ChatMessage | undefined
    while (true) {
      data = filteredMessage.shift()
      if (!data || data.contextFlag) {
        if (userTurn) {
          // user-assistant消息pair中，无user消息，此时删除assistant消息
          if (context.length > 0 && context[0].role === Role.Assistant) context.shift()
        }
        break
      }
      if (userTurn) {
        if (data.content.role === Role.User) {
          context.unshift(extractData(data.content))
          userTurn = false
        } else {
          // 丢弃上下文,`DeepSeek-r1`要求消息必须是`Role.User`和`Role.Assistant`交替出现
          if (context.length > 0 && context[0].role === Role.Assistant) context.shift()
        }
      } else {
        if (data.content.role == Role.Assistant) {
          context.unshift({
            role: data.content.role,
            content: data.content.children?.map(item => item.content as string).join("\n") ?? "",
          })
          userTurn = true
        } else {
          // drop
        }
      }
    }
    if (maxContextLength > -1 && context.length > maxContextLength) {
      context = context.slice(context.length - maxContextLength)
      if (context.length > 0 && context[0].role === Role.Assistant) context.shift()
    }
    context.unshift({ role: Role.System, content: JSON.stringify({ type: "text", content: topic.prompt }) })
    return context
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
