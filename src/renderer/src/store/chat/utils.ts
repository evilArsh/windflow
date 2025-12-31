import { isUndefined, toNumber } from "@toolmain/shared"
import { createChatMessage } from "@windflow/core/message"
import {
  ChatLLMConfig,
  ChatMessage,
  ChatMessageTree,
  ChatTopic,
  ChatTopicTree,
  ChatTTIConfig,
} from "@windflow/core/types"

export const VirtualNodeIdPrefix = "virtual_"
/**
 * `data` must be sorted by `index`
 */
export const assembleMessageTree = (
  data: ChatMessage[],
  cb: (item: ChatMessage) => ChatMessageTree
): ChatMessageTree[] => {
  const res: ChatMessageTree[] = []
  const maps: Record<string, ChatMessageTree> = {}
  // how many nodes have same fromId
  const fromWeakMap = new WeakMap<ChatMessageTree, number>()
  data.forEach(item => {
    const node = cb(item)
    maps[item.id] = node
    if (item.fromId) {
      const fromNode = maps[item.fromId]
      if (fromNode) {
        const fromNodeNum = fromWeakMap.get(fromNode)
        fromWeakMap.set(fromNode, isUndefined(fromNodeNum) ? 1 : fromNodeNum + 1)
      } else {
        // isolated message, the from-message is not found
      }
    }
  })
  data.forEach(item => {
    if (item.fromId) {
      const fromNodeNumber = toNumber(fromWeakMap.get(maps[item.fromId]))
      if (fromNodeNumber > 1) {
        const current = maps[item.id]
        const vId = `${VirtualNodeIdPrefix}${item.fromId}`
        let parent: ChatMessageTree | undefined = maps[vId]
        if (!parent) {
          parent = cb(createChatMessage({ id: vId }))
          maps[vId] = parent
          res.unshift(parent)
        }
        current.parentId = parent.id
        parent.children.unshift(current)
        parent.children.sort((a, b) => a.node.index - b.node.index)
      } else {
        res.unshift(maps[item.id])
      }
    } else {
      res.unshift(maps[item.id])
    }
  })
  return res
}

export const assembleTopicTree = (data: ChatTopic[], cb: (item: ChatTopic) => ChatTopicTree): ChatTopicTree[] => {
  const res: ChatTopicTree[] = []
  const maps: Record<string, ChatTopicTree> = {}
  data.forEach(item => {
    maps[item.id] = cb(item)
  })
  data.forEach(item => {
    if (!item.parentId) {
      res.push(maps[item.id])
    } else {
      if (maps[item.parentId]) {
        maps[item.parentId].children.push(maps[item.id])
        maps[item.parentId].children.sort((a, b) => a.node.index - b.node.index)
      }
    }
  })
  return res
}

export function topicToTree(topic: ChatTopic): ChatTopicTree {
  return {
    id: topic.id,
    node: topic,
    children: [],
  }
}
export function wrapMessage(msg: ChatMessage): ChatMessageTree {
  return {
    id: msg.id,
    node: msg,
    children: [],
  }
}
export function unwrapMessage(msgTree: ChatMessageTree): ChatMessage {
  return msgTree.node
}
export function findChatMessage(
  topicId: string,
  chatMessageMap: Record<string, ChatMessageTree[]>
): ChatMessageTree[] | undefined {
  return chatMessageMap[topicId]
}
export function findChatLLMConfig(
  topicId: string,
  chatConfigMap: Record<string, ChatLLMConfig>
): ChatLLMConfig | undefined {
  return chatConfigMap[topicId]
}
export function findChatTTIConfig(
  topicId: string,
  chatTTIConfig: Record<string, ChatTTIConfig>
): ChatTTIConfig | undefined {
  return chatTTIConfig[topicId]
}
/**
 * find non-nested message by `messageId`
 *
 * @param isolated limit the search scope closest to `messageId` according to the field `contextFlag` with value `ChatMessageContextFlag.BOUNDARY`
 */
export function findNonNestedMessageById(
  topicId: string,
  messageId: string,
  chatMessageMap: Record<string, ChatMessageTree[]>
): ChatMessageTree | undefined {
  const rawMessages = findChatMessage(topicId, chatMessageMap)
  if (!rawMessages) return
  return rawMessages.find(item => item.id === messageId)
}
function getIndex(
  topicId: string,
  messageId: string,
  chatMessageMap: Record<string, ChatMessageTree[]>,
  target?: ChatMessageTree
): number {
  if (target) {
    return target.children.findIndex(item => item.id === messageId)
  }
  return findChatMessage(topicId, chatMessageMap)?.findIndex(item => item.id === messageId) ?? -1
}
export function removeMessage(messageTree: ChatMessageTree, chatMessageMap: Record<string, ChatMessageTree[]>) {
  // it's a nested message, delete it from it's parent's children
  if (messageTree.parentId) {
    const parent = findNonNestedMessageById(messageTree.node.topicId, messageTree.parentId, chatMessageMap)
    if (parent) {
      const message = unwrapMessage(messageTree)
      const index = getIndex(message.topicId, message.id, chatMessageMap, parent)
      if (index > -1) {
        parent.children.splice(index, 1)
      } else {
        console.warn("[removeMessage] child not found", message.id)
      }
    } else {
      console.warn("[removeMessage] parent not found", unwrapMessage(messageTree).fromId)
    }
  } else {
    const message = unwrapMessage(messageTree)
    const index = getIndex(message.topicId, message.id, chatMessageMap)
    if (index > -1) {
      findChatMessage(message.topicId, chatMessageMap)?.splice(index, 1)
    } else {
      console.warn("[removeMessage] message not found", message.id)
    }
  }
}
export function getAllNodes(current: ChatTopicTree): ChatTopic[] {
  const res: ChatTopic[] = []
  res.push(current.node)
  current.children.forEach(item => {
    res.push(item.node)
    res.push(...getAllNodes(item))
  })
  return res
}
export function findMaxMessageIndex(messages: ChatMessageTree[]): number {
  return Math.max(0, ...messages.map(item => item.node.index))
}
export function findMaxTopicIndex(topic: ChatTopicTree[]): number {
  return Math.max(0, ...topic.map(item => item.node.index))
}
