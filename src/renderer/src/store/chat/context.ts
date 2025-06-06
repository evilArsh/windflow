import { ChatContext, ChatMessageData, ChatTopic, LLMMessage, LLMProvider, Role } from "@renderer/types"
import { cloneDeep } from "lodash"

export const useContext = () => {
  // 文本聊天请求缓存, 切换聊天时，继续请求,使用topicId作为key
  const llmChats = reactive<Record<string, ChatContext[]>>({})
  /**
   * @description 获取上下文，如果不存在则创建一个，messageDataId可能是子对话id
   */
  const fetchTopicContext = (
    topicId: string,
    modelId: string,
    messageDataId: string,
    messageId: string,
    provider: LLMProvider
  ) => {
    if (!llmChats[topicId]) {
      llmChats[topicId] = []
      llmChats[topicId].push({
        modelId: modelId,
        provider: markRaw(provider),
        messageId: messageId,
        messageDataId: messageDataId,
      })
      return llmChats[topicId][0]
    }
    const res = llmChats[topicId].find(item => item.messageId === messageId && item.messageDataId === messageDataId)
    if (!res) {
      llmChats[topicId].push({
        modelId: modelId,
        provider: markRaw(provider),
        messageId: messageId,
        messageDataId: messageDataId,
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
   * TODO: 中间有删除消息时,删除与之配对的`Role.Assistant`或者`Role.User`消息
   */
  const getMessageContext = (topic: ChatTopic, message: ChatMessageData[]) => {
    const context: LLMMessage[] = []
    let userTurn = true
    const extractData = (data: LLMMessage): LLMMessage => {
      return {
        role: data.role,
        content: data.content,
      }
    }
    const arrayAndNotEmpty = (data: unknown): data is Array<unknown> => {
      return Array.isArray(data) && data.length > 0
    }
    while (true) {
      const data = message.shift()
      if (!data) break
      if (data.contextFlag) break
      const item = cloneDeep(data)
      item.content.reasoning_content = undefined // deepseek patch
      if (userTurn) {
        if (item.content.role === Role.User) {
          context.unshift(extractData(item.content))
          userTurn = false
        } else {
          // 丢弃上下文,`DeepSeek-r1`要求消息必须是`Role.User`和`Role.Assistant`交替出现
          if (context.length > 0) {
            if (context[0].role === Role.Assistant) {
              context.shift()
            }
          }
        }
      } else {
        if (item.content.role == Role.Assistant) {
          const content = extractData(item.content)
          context.unshift(content)
          if (arrayAndNotEmpty(item.content.tool_calls) && arrayAndNotEmpty(item.content.tool_calls_chain)) {
            for (let i = item.content.tool_calls_chain.length - 1; i >= 0; i--) {
              const chain = extractData(item.content.tool_calls_chain[i])
              chain.tool_call_id = item.content.tool_calls_chain[i].tool_call_id
              context.unshift(chain)
            }
            context.unshift({
              role: content.role,
              content: "",
              tool_calls: item.content.tool_calls,
            })
          }
          userTurn = true
        } else {
          // drop
        }
      }
    }
    if (userTurn) {
      // user-assistant消息pair中，无user消息，此时删除assistant消息
      if (context.length > 0 && context[0].role === Role.Assistant) {
        context.shift()
      }
    }
    context.unshift({ role: Role.System, content: JSON.stringify([{ type: "text", content: topic.prompt }]) })
    return context
  }
  function hasTopic(topicId: string) {
    return !!llmChats[topicId]
  }
  function findContext(topicId: string, messageDataId: string): ChatContext | undefined {
    if (hasTopic(topicId)) {
      return llmChats[topicId].find(item => item.messageDataId === messageDataId)
    }
    console.warn(`[findContext] topicId not found.${topicId} ${messageDataId}`)
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

  return {
    fetchTopicContext,
    getMessageContext,
    hasTopic,
    findContext,
    findTopicContext,
    initContext,
  }
}
