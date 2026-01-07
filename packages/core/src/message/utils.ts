import {
  ChatMessage,
  ChatMessageContextFlag,
  ChatMessageType,
  ChatTopic,
  Message,
  ModelMeta,
  Role,
} from "@windflow/core/types"
import { defaultMessage } from "@windflow/core/storage"
import { cloneDeep, isArrayLength, isNumber, merge, toNumber, uniqueId } from "@toolmain/shared"
import { isASRType, isImageType, isTTSType, isVideoType } from "@windflow/core/models"

export function cloneTopic(topic: ChatTopic, initial?: Partial<ChatTopic>): ChatTopic {
  const part: Partial<ChatTopic> = {
    id: uniqueId(),
    label: "",
    parentId: "",
    requestCount: 0,
    maxContextLength: isNumber(topic.maxContextLength) ? topic.maxContextLength : 7,
  }
  return cloneDeep(merge({}, topic, part, initial))
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
      if (lastCtx && lastCtx.content.role !== Role.User) {
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
        if (lastMsg && lastMsg.role !== Role.User) {
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
