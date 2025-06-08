import { getDefaultIcon } from "@renderer/components/SvgPicker"
import { ChatMessage, ChatMessageData, ChatTopic, ChatTopicTree } from "@renderer/types"
import { cloneDeep } from "lodash-es"
import { Reactive } from "vue"

export const useUtils = (
  _topicList: Reactive<Array<ChatTopicTree>>,
  chatMessage: Reactive<Record<string, ChatMessage>>,
  _currentNodeKey: Ref<string>
) => {
  /**
   * @description 根据消息id查找缓存的聊天数据
   */
  const findChatMessage = (messageId: string): ChatMessage | undefined => {
    return chatMessage[messageId]
  }
  const findChatMessageByTopic = (topic: ChatTopic): ChatMessage | undefined => {
    if (!topic.chatMessageId) return
    return findChatMessage(topic.chatMessageId)
  }
  /**
   * @description  当`parentMessageDataId`存在时，返回的index为parentMessageDataId下的子聊天messageDataId的索引
   */
  const findChatMessageChild = (
    messageId: string,
    childMessageId: string,
    parentMessageDataId?: string
  ): [ChatMessageData | undefined, number] => {
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
  ): [ChatMessageData | undefined, number] => {
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
      chatMessageId: "",
      createAt: Date.now(),
      requestCount: 0,
      mcpServers: [],
    }
  }
  function cloneTopic(topic: ChatTopic, parentId: string | null, label: string): ChatTopic {
    return cloneDeep({
      ...topic,
      id: uniqueId(),
      label,
      parentId,
      chatMessageId: "",
      requestCount: 0,
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
    findChatMessage,
    findChatMessageChild,
    findChatMessageChildByTopic,
    findChatMessageByTopic,
    newTopic,
    cloneTopic,
    topicToTree,
    getAllNodes,
  }
}
