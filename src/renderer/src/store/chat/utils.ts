import { getDefaultIcon } from "@renderer/components/SvgPicker"
import {
  ChatLLMConfig,
  ChatMessage,
  ChatTopic,
  ChatTopicTree,
  ChatTTIConfig,
  ModelMeta,
  ProviderMeta,
} from "@renderer/types"
import { cloneDeep, isNumber, merge, uniqueId } from "@toolmain/shared"
import { Reactive } from "vue"
import useModelsStore from "@renderer/store/model"
import useProviderStore from "@renderer/store/provider"
import { storeToRefs } from "pinia"

export const useUtils = (
  chatMessage: Reactive<Record<string, ChatMessage[]>>,
  chatLLMConfig: Reactive<Record<string, ChatLLMConfig>>,
  chatTTIConfig: Reactive<Record<string, ChatTTIConfig>>
) => {
  const providerStore = useProviderStore()
  const modelsStore = useModelsStore()
  const { providerMetas } = storeToRefs(providerStore)

  /**
   * @description 根据消息id查找缓存的聊天数据
   */
  const findChatMessage = (topicId: string): ChatMessage[] | undefined => {
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
  /**
   * @description  当`parentMessageDataId`存在时，返回的index为parentMessageDataId下的子聊天messageDataId的索引
   */
  const findChatMessageChild = (
    topicId: string,
    messageId: string,
    parentMessageId?: string
  ): [ChatMessage | undefined, number] => {
    const messages = findChatMessage(topicId)
    if (!messages) return [undefined, -1]
    let index = -1
    if (parentMessageId) {
      const parent = messages.find(item => item.id === parentMessageId)
      const child = parent?.children?.find((item, i) => {
        if (item.id === messageId) {
          index = i
          return true
        }
        return false
      })
      return [child, index]
    } else {
      const res = messages.find((item, i) => {
        if (item.id === messageId) {
          index = i
          return true
        }
        return false
      })
      return [res, index]
    }
  }
  function newTopic(index: number, initial?: Partial<ChatTopic>): ChatTopic {
    return merge(
      {
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
      } as ChatTopic,
      initial
    )
  }
  function cloneTopic(topic: ChatTopic, initial?: Partial<ChatTopic>): ChatTopic {
    return cloneDeep(
      merge(
        {},
        topic,
        {
          id: uniqueId(),
          label: "",
          parentId: "",
          chatMessageId: "",
          requestCount: 0,
          maxContextLength: isNumber(topic.maxContextLength) ? topic.maxContextLength : 7,
        },
        initial
      )
    )
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
    return merge(
      {
        id: uniqueId(),
        status: 200,
        createAt: Date.now(),
        finish: true,
        content: "",
        index: 0,
        topicId: "",
        modelId: "",
        parentId: "",
      },
      { index, topicId },
      initial
    )
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
  function getMessageType(meta: ModelMeta) {
    return modelsStore.utils.isImageType(meta)
      ? "image"
      : modelsStore.utils.isVideoType(meta)
        ? "video"
        : modelsStore.utils.isTTSType(meta) || modelsStore.utils.isASRType(meta)
          ? "audio"
          : "text"
  }
  /**
   * @description 递归重置聊天信息,重置项为响应结果,其他不变
   */
  function resetChatMessage(message: ChatMessage) {
    message.finish = true
    message.status = 200
    message.createAt = Date.now()
    message.msg = ""
    message.completionTokens = 0
    message.promptTokens = 0
    if (message.children) {
      message.children.forEach(child => {
        resetChatMessage(child)
      })
    }
  }
  return {
    findChatLLMConfig,
    findChatTTIConfig,
    findChatMessage,
    findChatMessageChild,
    newTopic,
    newChatMessage,
    cloneTopic,
    topicToTree,
    getAllNodes,
    getMessageType,
    getMeta,
    resetChatMessage,
  }
}
