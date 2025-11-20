import {
  ChatContext,
  ChatMessageContextFlag,
  ChatMessageTree,
  ChatTopic,
  Message,
  Provider,
  Role,
} from "@renderer/types"
import { isArrayLength, toNumber } from "@toolmain/shared"

export const useContext = () => {
  // 文本聊天请求缓存, 切换聊天时，继续请求,使用topicId作为key
  const llmChats = reactive<Record<string, ChatContext[]>>({})
  /**
   * @param rawMessages sort in descending order by create time
   */
  const getMessageContext = (topic: ChatTopic, rawMessages: ChatMessageTree[]): Message[] => {
    const maxContextLength = Math.max(1, toNumber(topic.maxContextLength))
    const boundaryIndex = rawMessages.findIndex(item => item.node.contextFlag === ChatMessageContextFlag.BOUNDARY)
    const messages = rawMessages.slice(0, Math.max(0, boundaryIndex))
    const contexts: ChatMessageTree[] = []
    let current: ChatMessageTree | undefined
    let firstCtx: ChatMessageTree | undefined
    const isEmptyContexts = (contexts: ChatMessageTree[]) => !contexts.length
    const getFirstContext = (contexts: ChatMessageTree[]) => (!isEmptyContexts(contexts) ? contexts[0] : undefined)
    while (true) {
      current = messages.shift()
      firstCtx = getFirstContext(contexts)
      if (!current) {
        if (firstCtx?.node.content.role !== Role.User) contexts.shift()
        break
      }
      if (current.node.content.role === Role.User) {
        if (!firstCtx) {
          contexts.unshift(current)
        } else if (firstCtx.node.content.role === Role.User) {
          continue
        } else if (firstCtx.node.content.role === Role.Assistant) {
          if (firstCtx.node.fromId === current.id) {
            contexts.unshift(current)
          } else {
            contexts.shift()
          }
        } else {
          continue
        }
      } else if (current.node.content.role === Role.Assistant) {
        if (!firstCtx) {
          continue
        } else if (firstCtx.node.content.role === Role.User) {
          if (isArrayLength(current.children)) {
            const childCtx = current.children.find(item => item.node.contextFlag === ChatMessageContextFlag.PART)
            if (childCtx) {
              contexts.unshift(childCtx)
            } else {
              continue
            }
          } else {
            contexts.unshift(current)
          }
        } else {
          continue
        }
      } else {
        continue
      }
    }
    firstCtx = getFirstContext(contexts)
    if (firstCtx?.node.content.role === Role.Assistant) {
      contexts.shift()
    }
    const newContexts = contexts
      .slice(Math.max(0, contexts.length - maxContextLength))
      .map(ctx => ({ role: ctx.node.content.role, content: ctx.node.content.content }))
    newContexts.unshift({
      role: Role.System,
      content: topic.prompt,
    })
    return newContexts
  }
  /**
   * @description 获取上下文，如果不存在则创建一个
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
