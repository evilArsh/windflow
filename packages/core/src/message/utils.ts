import {
  ChatMessage,
  ChatMessageContextFlag,
  ChatMessageType,
  ChatTopic,
  Message,
  ModelMeta,
  Role,
} from "@windflow/core/types"
import { storage, withTransaction } from "@windflow/core/storage"
import { defaultMessage } from "@windflow/core/storage/presets/chat"
import { isArrayLength, isUndefined, merge, toNumber, uniqueId } from "@toolmain/shared"
import { isASRType, isImageType, isTTSType, isVideoType } from "@windflow/core/models/utils"

const MessageIndexStep = 100
export async function saveNewMessages(messages: ChatMessage[]) {
  return withTransaction("rw", ["chatTopic"], async t => {
    const messagesByTopic = messages.reduce<Record<string, ChatMessage[]>>((acc, message) => {
      if (!acc[message.topicId]) {
        acc[message.topicId] = []
      }
      acc[message.topicId].push(message)
      return acc
    }, {})

    // get max index of messages in each topic
    const topicIds = Object.keys(messagesByTopic)
    const maxIndices = await Promise.all(
      topicIds.map(async topicId => {
        return storage.chat.getMaxIndexMessage(topicId, { transaction: t })
      })
    )
    const indexMap = new Map(maxIndices.filter(v => !isUndefined(v)).map(({ topicId, index }) => [topicId, index]))

    const allMessagesToInsert: ChatMessage[] = []
    for (const [topicId, topicMessages] of Object.entries(messagesByTopic)) {
      const maxIndex = indexMap.get(topicId) ?? 0
      const messagesWithIndex = topicMessages.map((message, i) => ({
        ...message,
        index: maxIndex + MessageIndexStep * (i + 1),
      }))
      allMessagesToInsert.push(...messagesWithIndex)
    }
    await storage.chat.bulkAddChatMessage(allMessagesToInsert, { transaction: t })
  })
}
/**
 * insert new messages after `current` message, messages must have the same `topicId` as `current`
 */
export async function insertNewMessages(current: ChatMessage, messages: ChatMessage[]) {
  const currentIndex = current.index ?? 0
  const messagesWithIndex = messages.map((message, i) => ({
    ...message,
    index: currentIndex + i + 1,
  }))
  return storage.chat.bulkAddChatMessage(messagesWithIndex)
}
export function createChatTopic(initial?: Partial<ChatTopic>): ChatTopic {
  const dst: ChatTopic = {
    id: uniqueId(),
    index: 0,
    label: "",
    parentId: "",
    // TODO: default value
    icon: "",
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
export function createChatMessage(initial?: Partial<ChatMessage>): ChatMessage {
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
    // parentId: "",
  }
  return merge(dst, initial)
}

export function getMessageType(meta: ModelMeta): ChatMessageType {
  return isImageType(meta)
    ? ChatMessageType.IMAGE
    : isVideoType(meta)
      ? ChatMessageType.VIDEO
      : isTTSType(meta) || isASRType(meta)
        ? ChatMessageType.AUDIO
        : ChatMessageType.TEXT
}

/**
 * find the sub-messages closest to `messageId` that are bounded by messages where `contextFlag` equals `ChatMessageContextFlag.BOUNDARY`
 */
export function getIsolatedMessages(messages: ChatMessage[], messageId: string): ChatMessage[] {
  const index = messages.findIndex(item => item.id === messageId)
  if (index === -1) return []
  if (messages[index].contextFlag === ChatMessageContextFlag.BOUNDARY) return []
  let start = index - 1
  let end = index + 1
  let startDone = false
  let endDone = false
  while (true) {
    if (start >= 0 && messages[start].contextFlag !== ChatMessageContextFlag.BOUNDARY) start--
    else startDone = true
    if (end < messages.length && messages[end].contextFlag !== ChatMessageContextFlag.BOUNDARY) end++
    else endDone = true
    if (startDone && endDone) break
  }
  start = Math.max(0, start + 1)
  return messages.slice(start, end)
}
/**
 * @param rawMessages sorted in ascending order by `index`
 */
export function getMessageContexts(topic: ChatTopic, rawMessages: ChatMessage[]): Message[] {
  const maxContextLength = Math.max(1, toNumber(topic.maxContextLength))
  const messages = Array.from(rawMessages)
  const contexts: ChatMessage[] = []
  let newContexts: Message[] | undefined
  let current: ChatMessage | undefined
  let lastCtx: ChatMessage | undefined
  let lastMsg: Message | undefined
  const getLastContext = <T>(contexts: T[]) => (isArrayLength(contexts) ? contexts[0] : undefined)
  while (true) {
    current = messages.pop()
    lastCtx = getLastContext(contexts)
    if (!current) {
      if (lastCtx?.content.role !== Role.User) {
        contexts.shift()
      } else if (!newContexts) {
        newContexts = contexts.slice(Math.max(0, contexts.length - maxContextLength)).map(ctx => ({
          role: ctx.content.role,
          content:
            ctx.content.role === Role.User
              ? ctx.content.content
              : (ctx.content.children?.map(item => item.content as string).join("\n") ?? ""),
        }))
      } else {
        lastMsg = getLastContext(newContexts)
        if (lastMsg?.role !== Role.User) {
          newContexts.shift()
        } else {
          break
        }
      }
    } else if (current.content.role === Role.User) {
      if (!lastCtx) {
        contexts.unshift(current)
      } else if (lastCtx.content.role === Role.User) {
        continue
      } else if (lastCtx.content.role === Role.Assistant) {
        if (lastCtx.fromId === current.id) {
          contexts.unshift(current)
        } else {
          contexts.shift()
        }
      } else {
        continue
      }
    } else if (current.content.role === Role.Assistant) {
      if (!lastCtx) {
        continue
      } else if (lastCtx.content.role === Role.User) {
        contexts.unshift(current)
      } else {
        continue
      }
    } else {
      continue
    }
  }
  newContexts.unshift({
    role: Role.System,
    content: topic.prompt,
  })
  return newContexts
}
