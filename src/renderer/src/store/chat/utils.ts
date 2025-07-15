import { getDefaultIcon } from "@renderer/components/SvgPicker"
import { ChatLLMConfig, ChatMessage2, ChatTopic, ChatTopicTree, ChatTTIConfig } from "@renderer/types"
import { cloneDeep, merge } from "lodash-es"
import { Reactive } from "vue"

export const useUtils = (
  _topicList: Reactive<Array<ChatTopicTree>>,
  chatMessage: Reactive<Record<string, ChatMessage2[]>>,
  chatLLMConfig: Reactive<Record<string, ChatLLMConfig>>,
  chatTTIConfig: Reactive<Record<string, ChatTTIConfig>>,
  _currentNodeKey: Ref<string>
) => {
  /**
   * @description 根据消息id查找缓存的聊天数据
   */
  const findChatMessage = (topicId: string): ChatMessage2[] | undefined => {
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
    messageId: string,
    childMessageId: string,
    parentMessageDataId?: string
  ): [ChatMessage2 | undefined, number] => {
    const m = findChatMessage(messageId)
    if (!m) return [undefined, -1]
    let index = -1
    if (parentMessageDataId) {
      const parent = m.data.find(item => item.id === parentMessageDataId)
      const child = parent?.children?.find((item, i) => {
        if (item.id === childMessageId) {
          index = i
          return true
        }
        return false
      })
      return [child, index]
    } else {
      const res = m.data.find((item, i) => {
        if (item.id === childMessageId) {
          index = i
          return true
        }
        return false
      })
      return [res, index]
    }
  }
  /**
   * @description  当`parentMessageDataId`存在时，返回的index为parentMessageDataId下的messageDataId的索引
   */
  const findChatMessageChildByTopic = (
    topic: ChatTopic,
    messageDataId: string,
    parentMessageDataId?: string
  ): [ChatMessage2 | undefined, number] => {
    if (!topic.chatMessageId) {
      return [undefined, -1]
    }
    const message = findChatMessage(topic.chatMessageId)
    if (!message) [undefined, -1]
    return findChatMessageChild(topic.chatMessageId, messageDataId, parentMessageDataId)
  }

  function newTopic(parentId: string | null, modelIds: string[], label: string): ChatTopic {
    return {
      id: uniqueId(),
      label,
      parentId,
      icon: getDefaultIcon(),
      content: "",
      modelIds: cloneDeep(modelIds),
      prompt: "you are a helpful assistant",
      createAt: Date.now(),
      requestCount: 0,
      maxContextLength: 7,
    }
  }
  function newChatMessageData(initial?: Partial<ChatMessage2>): ChatMessage2 {
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
      initial
    )
  }
  function cloneTopic(topic: ChatTopic, parentId: string | null, label: string): ChatTopic {
    return cloneDeep({
      ...topic,
      id: uniqueId(),
      label,
      parentId,
      chatMessageId: "",
      requestCount: 0,
      maxContextLength: isNumber(topic.maxContextLength) ? topic.maxContextLength : 7,
    })
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

  return {
    findChatLLMConfig,
    findChatTTIConfig,
    findChatMessage,
    findChatMessageChild,
    findChatMessageChildByTopic,
    // findChatMessageByTopic,
    newTopic,
    newChatMessageData,
    cloneTopic,
    topicToTree,
    getAllNodes,
  }
}
