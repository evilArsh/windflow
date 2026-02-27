import {
  ChatMessage,
  ChatMessageContextFlag,
  ChatMessageType,
  ChatTopic,
  Content,
  LLMContent,
  Media,
  Message,
  ModelMeta,
  Role,
} from "@windflow/core/types"
import { useRequest } from "@windflow/core/provider"
import { storage, defaultMessage, withTransaction } from "@windflow/core/storage"
import {
  cloneDeep,
  errorToText,
  isArray,
  isArrayLength,
  isBase64Image,
  isHTTPUrl,
  isNumber,
  isString,
  isUndefined,
  merge,
  toNumber,
  uniqueId,
} from "@toolmain/shared"
import { isASRType, isImageType, isTTSType, isVideoType } from "@windflow/core/models"
import json5 from "json5"
import { MessageManager } from "."

/**
 * use to listen all topics and messages events
 */
export const AllTopicsFlag = "AllTopicFlag"
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
    inputHeight: 200,
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
    mediaIds: [],
  }
  return merge(dst, initial)
}

/**
 * reset message's realtime content: "status,finish,content,msg" to pending status
 */
export function resetMessage(message: ChatMessage) {
  message.status = 100
  message.finish = false
  message.content = defaultMessage()
  message.msg = undefined
  return message
}
export function formatContent(content: Content): LLMContent[] {
  if (isString(content)) {
    return [{ type: "text", content: content }]
  }
  if (isArray(content)) {
    return content.map(c => {
      return isString(c) ? { type: "text", content: c } : c
    })
  }
  return [content]
}
export function formatContentString(content: Content): string {
  if (isString(content)) {
    return content
  }
  if (isArray(content)) {
    return content
      .map(c => {
        return isString(c) ? c : c.type === "text" ? c.content : json5.stringify(c)
      })
      .join("")
  }
  return content.type === "text" ? content.content : json5.stringify(content)
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
  end = Math.min(messages.length, end, index)
  return messages.slice(start, end)
}
/**
 * assemble media contents to message contexts
 */
export async function consumeMediaContent(contexts: ChatMessage[]): Promise<Message[]> {
  try {
    const last = contexts[contexts.length - 1]
    const mediaIds = last.mediaIds
    if (last.content.role === Role.User && isArrayLength(mediaIds)) {
      const medias: Media[] = (
        await Promise.allSettled(
          mediaIds.map(mediaId => {
            return storage.media.get(mediaId)
          })
        )
      )
        .filter(res => res.status === "fulfilled")
        .map(res => res.value)
        .filter(res => !isUndefined(res))
      // FIXME: transform if the media is a blob
      const mediaContents: LLMContent[] = medias
        .map(item => {
          if (!isUndefined(item) && isString(item.data)) {
            return {
              type: item.type,
              content: item.data,
            }
          }
        })
        .filter(item => !isUndefined(item))
      last.content.content = formatContent(last.content.content).concat(mediaContents)
    }
    return contexts.map(ctx => ctx.content)
  } catch (error) {
    console.error("[consumeMediaContent]", error)
    return contexts.map(ctx => ctx.content)
  }
}
/**
 * @param rawMessages sorted in ascending order by `index`
 */
export function getMessageContexts(topic: ChatTopic, rawMessages: ChatMessage[]): ChatMessage[] {
  const maxContextLength = Math.max(1, toNumber(topic.maxContextLength))
  const messages = Array.from(rawMessages)
  const contexts: ChatMessage[] = []
  let newContexts: ChatMessage[] | undefined
  let current: ChatMessage | undefined
  let lastCtx: ChatMessage | undefined
  let lastMsg: ChatMessage | undefined
  const getLastContext = <T>(contexts: T[]) => (isArrayLength(contexts) ? contexts[0] : undefined)
  while (true) {
    current = messages.pop()
    lastCtx = getLastContext(contexts)
    if (!current) {
      if (lastCtx && lastCtx.content.role !== Role.User) {
        contexts.shift()
      } else if (!newContexts) {
        newContexts = contexts.slice(Math.max(0, contexts.length - maxContextLength)).map(ctx => {
          return {
            ...ctx,
            content: {
              role: ctx.content.role,
              content:
                ctx.content.role === Role.User
                  ? formatContent(ctx.content.content)
                  : (ctx.content.children?.map(item => formatContent(item.content)).flat() ?? ""),
            },
          }
        })
      } else {
        lastMsg = getLastContext(newContexts)
        if (lastMsg && lastMsg.content.role !== Role.User) {
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
  newContexts.unshift(
    createChatMessage({
      content: {
        role: Role.System,
        content: topic.prompt,
      },
    })
  )
  return newContexts
}

export class MediaHandler {
  #req: ReturnType<typeof useRequest>
  constructor() {
    this.#req = useRequest()
  }
  async download(
    msgMgr: MessageManager,
    message: ChatMessage,
    contextId?: string,
    type?: "image" | "video" | "audio" | "file"
  ) {
    try {
      const content = message.content.content
      const urls = (isArrayLength(content) ? content : [content]).map(val => (isString(val) ? val : val.content))
      const pendings = await Promise.allSettled(
        urls.map(async url => {
          if (isBase64Image(url)) {
            return (await fetch(url)).blob()
          } else if (isHTTPUrl(url)) {
            return this.#req.request({
              url,
              method: "GET",
              responseType: "blob",
            }).promise
          }
        })
      )
      const results = pendings
        .map<Media | undefined>(item => {
          if (item.status === "fulfilled") {
            const id = uniqueId()
            return {
              id,
              name: id,
              data: item.value ? (item.value instanceof Blob ? item.value : item.value.data) : "",
              type: type ?? "file",
            }
          }
        })
        .filter(item => !!item)

      const mediaIds = results.map(item => item.id)
      await withTransaction("rw", ["media", "chatMessage"], async tx => {
        await Promise.all([
          storage.media.bulkAdd(results, { disableQueue: true, transaction: tx }),
          storage.chat.updateChatMessage(message.id, { mediaIds }, { disableQueue: true, transaction: tx }),
        ])
      })
      message.finish = true
      message.mediaIds = mediaIds
      msgMgr.emitMessage(message, contextId)
    } catch (error) {
      console.error("[download]", error)
      message.finish = true
      message.msg = errorToText(error)
      msgMgr.emitMessage(message, contextId)
    }
  }
  abortAll() {
    this.#req.abortAll()
  }
}
