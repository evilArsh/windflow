import { getDefaultIcon } from "@renderer/components/SvgPicker"
import {
  ChatLLMConfig,
  ChatMessage,
  ChatMessageContextFlag,
  ChatMessageTree,
  ChatMessageType,
  ChatTopic,
  ChatTopicTree,
  ChatTTIConfig,
  Message,
  ModelMeta,
  ProviderMeta,
  Role,
} from "@windflow/core/types"
import { cloneDeep, isArrayLength, isNumber, merge, toNumber, uniqueId } from "@toolmain/shared"
// import useModelsStore from "@renderer/store/model"
// import useProviderStore from "@renderer/store/provider"
// import { storeToRefs } from "pinia"
import { defaultMessage } from "../storage/presets"

export const useUtils = (
  chatMessage: Record<string, ChatMessageTree[]>,
  chatLLMConfig: Record<string, ChatLLMConfig>,
  chatTTIConfig: Record<string, ChatTTIConfig>
) => {
  // const providerStore = useProviderStore()
  // const modelsStore = useModelsStore()
  // const { providerMetas } = storeToRefs(providerStore)

  /**
   * find the closest sub-messages between `messageId` where the `contextFlag` field value is "ChatMessageContextFlag.BOUNDARY"
   */
  const getIsolatedMessages = (messages: ChatMessageTree[], messageId: string): ChatMessageTree[] => {
    const index = messages.findIndex(item => item.id === messageId)
    if (index === -1) return []
    if (messages[index].node.contextFlag === ChatMessageContextFlag.BOUNDARY) return []
    let start = index - 1
    let end = index + 1
    let startDone = false
    let endDone = false
    while (true) {
      if (start >= 0 && messages[start].node.contextFlag !== ChatMessageContextFlag.BOUNDARY) start--
      else startDone = true
      if (end < messages.length && messages[end].node.contextFlag !== ChatMessageContextFlag.BOUNDARY) end++
      else endDone = true
      if (startDone && endDone) break
    }
    start = Math.max(0, start + 1)
    return messages.slice(start, end)
  }
  /**
   * @description 根据消息`topicId`查找缓存的聊天数据
   */
  const findChatMessage = (topicId: string): ChatMessageTree[] | undefined => {
    return chatMessage[topicId]
  }
  /**
   * @description 根据话题id查找缓存的llm配置数据
   */
  const findChatLLMConfig = (topicId: string): ChatLLMConfig | undefined => {
    return chatLLMConfig[topicId]
  }
  /**
   * @description 根据话题id查找缓存tti配置数据
   */
  const findChatTTIConfig = (topicId: string): ChatTTIConfig | undefined => {
    return chatTTIConfig[topicId]
  }
  function newTopic(index: number, initial?: Partial<ChatTopic>): ChatTopic {
    const dst: ChatTopic = {
      id: uniqueId(),
      index,
      label: "",
      parentId: "",
      icon: getDefaultIcon(),
      content: "",
      modelIds: [],
      knowledgeId: [],
      prompt: "you are a helpful assistant",
      createAt: Date.now(),
      requestCount: 0,
      maxContextLength: 7,
    }
    return merge(dst, initial)
  }
  function cloneTopic(topic: ChatTopic, initial?: Partial<ChatTopic>): ChatTopic {
    const part: Partial<ChatTopic> = {
      id: uniqueId(),
      label: "",
      parentId: "",
      requestCount: 0,
      maxContextLength: isNumber(topic.maxContextLength) ? topic.maxContextLength : 7,
    }
    return cloneDeep(merge({}, topic, part, initial))
  }
  function topicToTree(topic: ChatTopic): ChatTopicTree {
    return {
      id: topic.id,
      node: topic,
      children: [],
    }
  }
  function getAllNodes(current: ChatTopicTree): ChatTopic[] {
    const res: ChatTopic[] = []
    res.push(current.node)
    current.children.forEach(item => {
      res.push(item.node)
      res.push(...getAllNodes(item))
    })
    return res
  }
  function newChatMessage(topicId: string, index: number, initial?: Partial<ChatMessage>): ChatMessage {
    const dst: ChatMessage = {
      id: uniqueId(),
      status: 200,
      createAt: Date.now(),
      finish: true,
      content: defaultMessage(),
      type: ChatMessageType.TEXT,
      index: 0,
      topicId: "",
      modelId: "",
      parentId: "",
    }
    return merge(dst, initial, { index, topicId })
  }
  function getMeta(modelId: string) {
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
  function getMessageType(meta: ModelMeta): ChatMessageType {
    return modelsStore.utils.isImageType(meta)
      ? ChatMessageType.IMAGE
      : modelsStore.utils.isVideoType(meta)
        ? ChatMessageType.VIDEO
        : modelsStore.utils.isTTSType(meta) || modelsStore.utils.isASRType(meta)
          ? ChatMessageType.AUDIO
          : ChatMessageType.TEXT
  }
  /**
   * @description 递归重置聊天信息,重置项为响应结果,其他不变
   */
  function resetChatMessage(message: ChatMessageTree) {
    message.node.finish = true
    message.node.status = 200
    message.node.createAt = Date.now()
    message.node.msg = ""
    message.node.completionTokens = 0
    message.node.promptTokens = 0
    message.children.forEach(resetChatMessage)
  }
  /**
   * find index of `messageId` of messages in `topicId`, if `target` is provided, find it in `target`'s children
   */
  function getIndex(topicId: string, messageId: string, target?: ChatMessageTree): number {
    if (target) {
      return target.children.findIndex(item => item.id === messageId)
    }
    return findChatMessage(topicId)?.findIndex(item => item.id === messageId) ?? -1
  }
  /**
   * find non-nested message by `messageId`
   *
   * @param isolated limit the search scope between `messageId` according to the field `contextFlag` with value `ChatMessageContextFlag.BOUNDARY`
   */
  function findMessageById(topicId: string, messageId: string, isolated?: boolean): ChatMessageTree | undefined {
    const rawMessages = findChatMessage(topicId)
    if (!rawMessages) return
    return (isolated ? getIsolatedMessages(rawMessages, messageId) : rawMessages).find(
      item => item.node.id === messageId
    )
  }
  /**
   * find non-nested message in messages while one's `fromId` field value matches the giving `messageId`
   * @param isolated limit the search scope between `messageId` according to the field `contextFlag` with value `ChatMessageContextFlag.BOUNDARY`
   */
  function findMessageByFromIdField(
    topicId: string,
    messageId: string,
    isolated?: boolean
  ): ChatMessageTree | undefined {
    const rawMessages = findChatMessage(topicId)
    if (!rawMessages) return
    return (isolated ? getIsolatedMessages(rawMessages, messageId) : rawMessages).find(
      item => item.node.fromId === messageId
    )
  }
  /**
   * find in messages while one's `parentId` field value matches the giving `messageId`
   * @param isolated limit the search scope between `messageId` according to the field `contextFlag` with value `ChatMessageContextFlag.BOUNDARY`
   */
  function findMessageByParentIdField(
    topicId: string,
    messageId: string,
    isolated?: boolean
  ): ChatMessageTree | undefined {
    const rawMessages = findChatMessage(topicId)
    if (!rawMessages) return
    return (isolated ? getIsolatedMessages(rawMessages, messageId) : rawMessages).find(
      item => item.node.parentId === messageId
    )
  }
  function findMaxMessageIndex(messages: ChatMessageTree[]): number {
    return Math.max(0, ...messages.map(item => item.node.index))
  }
  function findMaxTopicIndex(topic: ChatTopicTree[]): number {
    return Math.max(0, ...topic.map(item => item.node.index))
  }
  /**
   * remove `message` in cache, if `message` has a `parentId`, remove it from parent's children.
   */
  function removeMessage(topicId: string, message: ChatMessageTree) {
    // it's a nested message, delete it from it's parent's children
    if (message.node.parentId) {
      const parent = findMessageById(topicId, message.node.parentId)
      if (parent) {
        const index = getIndex(topicId, message.node.id, parent)
        if (index > -1) {
          parent.children.splice(index, 1)
        } else {
          console.warn("[removeMessage] child not found", message.node.id)
        }
      } else {
        console.warn("[removeMessage] parent not found", message.node.parentId)
      }
    } else {
      const index = getIndex(topicId, message.node.id)
      if (index > -1) {
        findChatMessage(topicId)?.splice(index, 1)
      } else {
        console.warn("[removeMessage] message not found", message.node.id)
      }
    }
  }
  function wrapMessage(msg: ChatMessage): ChatMessageTree {
    return {
      id: msg.id,
      node: msg,
      children: [],
    }
  }
  function unwrapMessage(msgTree: ChatMessageTree): ChatMessage {
    return msgTree.node
  }
  return {
    findChatLLMConfig,
    findChatTTIConfig,
    findChatMessage,
    newTopic,
    newChatMessage,
    cloneTopic,
    topicToTree,
    getAllNodes,
    getMessageType,
    getMeta,
    resetChatMessage,
    findMessageByFromIdField,
    findMessageByParentIdField,
    wrapMessage,
    unwrapMessage,
    removeMessage,
    findMaxMessageIndex,
    findMaxTopicIndex,
    getIndex,
    getIsolatedMessages,
  }
}

/**
 * @param rawMessages sort in descending order by create time
 */
export const getMessageContext = (topic: ChatTopic, rawMessages: ChatMessageTree[]): Message[] => {
  const maxContextLength = Math.max(1, toNumber(topic.maxContextLength))
  const messages = Array.from(rawMessages)
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
  const newContexts = contexts.slice(Math.max(0, contexts.length - maxContextLength)).map(ctx => ({
    role: ctx.node.content.role,
    content:
      ctx.node.content.role === Role.User
        ? ctx.node.content.content
        : (ctx.node.content.children?.map(item => item.content as string).join("\n") ?? ""),
  }))
  newContexts.unshift({
    role: Role.System,
    content: topic.prompt,
  })
  return newContexts
}
