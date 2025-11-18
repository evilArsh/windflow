import { getDefaultIcon } from "@renderer/components/SvgPicker"
import {
  ChatLLMConfig,
  ChatMessage,
  ChatMessageTree,
  ChatMessageType,
  ChatTopic,
  ChatTopicTree,
  ChatTTIConfig,
  ModelMeta,
  ProviderMeta,
} from "@renderer/types"
import { cloneDeep, isNumber, merge, uniqueId } from "@toolmain/shared"
import useModelsStore from "@renderer/store/model"
import useProviderStore from "@renderer/store/provider"
import { storeToRefs } from "pinia"
import { defaultMessage } from "./default"

export const useUtils = (
  chatMessage: Record<string, ChatMessageTree[]>,
  chatLLMConfig: Record<string, ChatLLMConfig>,
  chatTTIConfig: Record<string, ChatTTIConfig>
) => {
  const providerStore = useProviderStore()
  const modelsStore = useModelsStore()
  const { providerMetas } = storeToRefs(providerStore)

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
    return merge(dst, { index, topicId }, initial)
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
   */
  function findMessageById(topicId: string, messageId: string): ChatMessageTree | undefined {
    return findChatMessage(topicId)?.find(item => item.node.id === messageId)
  }
  /**
   * find non-nested message in messages while one's `fromId` field value matches the giving `messageId`
   */
  function findMessageByFromIdField(topicId: string, messageId: string): ChatMessageTree | undefined {
    return findChatMessage(topicId)?.find(item => item.node.fromId === messageId)
  }
  /**
   * find in messages while one's `parentId` field value matches the giving `messageId`
   */
  function findMessageByParentIdField(topicId: string, messageId: string): ChatMessageTree | undefined {
    return findChatMessage(topicId)?.find(item => item.node.parentId === messageId)
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
  }
}
