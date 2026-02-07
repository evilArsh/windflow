import {
  ModelMeta,
  ChatMessage,
  Role,
  Content,
  ChatMessageType,
  ChatMessageContextFlag,
  ChatContextManager,
  ProviderManager,
  ChatEventResponse,
} from "@windflow/core/types"
import { isASRType, isChatType, isImageType, isTTSType, isVideoType } from "@windflow/core/models"

import { createChatMessage, getIsolatedMessages, getMessageContexts, getMessageType } from "./utils"
import { createChatContext } from "./context"
import { cloneDeep, EventBus, isArrayLength, isString, isUndefined, toNumber, useEvent } from "@toolmain/shared"
import { defaultMessage, defaultTTIConfig } from "@windflow/core/storage"
import { createProviderManager } from "@windflow/core/provider"
import { storage } from "@windflow/core/storage"
import { beforeLLMRequest } from "./hooks"
import { MessageStorage } from "./storage"

export * from "./utils"
export class MessageManager {
  readonly #ctx: ChatContextManager
  readonly #providerManager: ProviderManager
  readonly #ev: EventBus<ChatEventResponse>
  readonly #storage: MessageStorage
  constructor() {
    this.#ctx = createChatContext()
    this.#providerManager = createProviderManager()
    this.#ev = useEvent<ChatEventResponse>()
    this.#storage = new MessageStorage()
  }
  #emitMessage(message: ChatMessage, contextId?: string) {
    this.#ev.emit("message", { contextId, data: message })
  }
  async #sendChat(contextId: string, message: ChatMessage): Promise<void> {
    const ctx = this.#ctx.get(contextId)
    if (!ctx) return
    const { modelMeta, providerMeta, provider, handler, topicId, messageId } = ctx
    if (!(modelMeta && providerMeta && provider)) return
    const topic = await storage.chat.getTopic(topicId)
    if (!topic) return
    handler?.terminate()
    const messages = await storage.chat.getChatMessages(topicId)
    const rawContexts = getIsolatedMessages(messages, messageId)
    const contexts = getMessageContexts(topic, rawContexts)
    message.status = 100
    message.finish = false
    this.#emitMessage(message, ctx.id)
    const newHandler = await provider.chat(
      contexts,
      modelMeta,
      providerMeta,
      value => {
        if (ctx.handler?.getSignal().aborted) {
          message.status = 499
          this.#emitMessage(message, ctx.id)
          return
        }
        const { data, status, msg } = value
        message.completionTokens = data.children?.reduce((acc, cur) => acc + toNumber(cur.usage?.completion_tokens), 0)
        message.promptTokens = data.children?.reduce((acc, cur) => acc + toNumber(cur.usage?.prompt_tokens), 0)
        message.status = status
        message.content = data
        message.msg = msg
        if (status == 206) {
          message.finish = false
        } else if (status == 200) {
          message.finish = true
        } else if (status == 100) {
          message.finish = false
        } else {
          message.finish = true
        }
        storage.chat.putChatMessage(message)
        this.#emitMessage(message, ctx.id)
      },
      beforeLLMRequest(topic, message)
    )
    this.#ctx.setHandler(contextId, newHandler)
  }
  async #sendMedia(contextId: string, message: ChatMessage): Promise<void> {
    const ctx = this.#ctx.get(contextId)
    if (!ctx) return
    const { modelMeta, providerMeta, provider, handler } = ctx
    if (!(modelMeta && providerMeta && provider)) return
    if (isImageType(modelMeta)) {
      if (!message.fromId) return
      const askMessage = await storage.chat.getChatMessage(message.fromId)
      if (!askMessage) return
      handler?.terminate()
      message.status = 100
      this.#emitMessage(message, ctx.id)
      const conf = (await storage.chat.getChatTTIConfig(message.topicId)) ?? defaultTTIConfig()
      const hdl = await provider.textToImage({ ...conf, prompt: askMessage.content }, modelMeta, providerMeta, res => {
        message.content = res.data
        message.finish = true
        message.status = res.status
        message.msg = res.msg
        this.#emitMessage(message, ctx.id)
      })
      this.#ctx.setHandler(contextId, hdl)
    } else {
      console.log("[media request not implement]", modelMeta, provider)
      message.finish = true
      message.status = 404
      message.content.content = "not implemented"
      this.#emitMessage(message, ctx.id)
    }
  }
  #getDispatcher(
    reqInfo: Array<{
      message: ChatMessage
      contextId: string
    }>
  ) {
    return reqInfo
      .map(info => {
        const ctx = this.#ctx.get(info.contextId)
        if (!ctx?.modelMeta) return
        if (isChatType(ctx.modelMeta)) {
          return this.#sendChat(info.contextId, info.message)
        } else if (
          isImageType(ctx.modelMeta) ||
          isVideoType(ctx.modelMeta) ||
          isTTSType(ctx.modelMeta) ||
          isASRType(ctx.modelMeta)
        ) {
          return this.#sendMedia(info.contextId, info.message)
        }
        return undefined
      })
      .filter(v => !isUndefined(v))
  }
  async #createResponseMessages(topicId: string, userMessageId: string, modelMetas: ModelMeta[]) {
    const reqInfo: Array<{
      message: ChatMessage
      contextId: string
    }> = []
    const providerMetas = new Map(
      (await storage.provider.bulkGet(modelMetas.map(m => m.providerName))).map((item, i) => [modelMetas[i].id, item])
    )
    // the first text model message as the default llm context
    const contextIndex = modelMetas.findIndex(m => getMessageType(m) === ChatMessageType.TEXT)
    for (let i = 0; i < modelMetas.length; i++) {
      const modelMeta = modelMetas[i]
      const provider = this.#providerManager.getProvider(modelMeta.providerName)
      const providerMeta = providerMetas.get(modelMeta.id)
      const type = getMessageType(modelMeta)
      if (provider && providerMeta) {
        const message = createChatMessage({
          content: defaultMessage(),
          fromId: userMessageId,
          topicId,
          type,
          contextFlag: contextIndex == i ? ChatMessageContextFlag.PART : undefined,
          finish: false,
          modelId: modelMeta.id,
          concurrency: modelMetas.length > 1,
        })
        const contextId = this.#ctx.create(topicId, message.id)
        this.#ctx.setProvider(contextId, provider)
        this.#ctx.setModelMeta(contextId, modelMeta)
        this.#ctx.setProviderMeta(contextId, providerMeta)
        reqInfo.push({ message, contextId })
      } else {
        console.warn(`[send msg] can't find provider: ${modelMeta.providerName}`)
      }
    }
    return reqInfo
  }
  getStorage(): MessageStorage {
    return this.#storage
  }
  removeAllListener() {
    this.#ev.removeAllListeners()
  }
  on<K extends keyof ChatEventResponse>(event: K, cb: ChatEventResponse[K]): void {
    this.#ev.on(event, cb)
  }
  off<K extends keyof ChatEventResponse>(event: K, cb: ChatEventResponse[K]): void {
    this.#ev.off(event, cb)
  }
  /**
   * send multiple messages and return context ids
   */
  async send(topicId: string, content: Content, modelIds: string[]): Promise<string[]> {
    const modelMetas = (await storage.model.bulkGet(modelIds)).filter(item => !isUndefined(item))
    const userMessage = createChatMessage({
      content: {
        role: Role.User,
        content: isString(content) ? content : cloneDeep(content),
      },
      // if only one model, use its type otherwise use all as arrays
      type: modelMetas.length == 1 ? getMessageType(modelMetas[0]) : modelMetas.map(m => getMessageType(m)),
      // only text type message can be the context
      contextFlag: modelMetas.some(m => getMessageType(m) === ChatMessageType.TEXT)
        ? ChatMessageContextFlag.PART
        : undefined,
      topicId,
    })
    const reqInfo = await this.#createResponseMessages(topicId, userMessage.id, modelMetas)
    await this.getStorage().addNewMessages([userMessage, ...reqInfo.map(i => i.message)])
    this.#emitMessage(userMessage)
    const dispatcher = this.#getDispatcher(reqInfo)
    await Promise.all(dispatcher)
    return reqInfo.map(info => info.contextId)
  }
  /**
   * restart request and return context id
   */
  async restart(topicId: string, messageId: string): Promise<string[]> {
    const topic = await storage.chat.getTopic(topicId)
    if (!topic) return []
    const currentMsg = await storage.chat.getChatMessage(messageId)
    if (!currentMsg) return []
    if (currentMsg.content.role === Role.User) {
      this.#emitMessage(currentMsg)
      // get user message's responding messages
      const msgs = await storage.chat.getMessagesByFromId(topicId, messageId)
      if (msgs.length) {
        const reqInfo: Array<{
          message: ChatMessage
          contextId: string
        }> = []
        const modelMetas = (await storage.model.bulkGet(msgs.map(msg => msg.modelId))).filter(
          meta => !isUndefined(meta)
        )
        const providerMetas = (await storage.provider.bulkGet(modelMetas.map(meta => meta?.providerName))).filter(
          meta => !isUndefined(meta)
        )
        msgs.forEach(msg => {
          const ctx = this.#ctx.findByTopic(topicId, msg.id)
          if (ctx) {
            ctx.handler?.terminate()
            reqInfo.push({ message: msg, contextId: ctx.id })
          } else {
            const newCtxId = this.#ctx.create(topicId, msg.id)
            const modelMeta = modelMetas.find(m => m.id === msg.modelId)
            const providerMeta = providerMetas.find(m => m.name === modelMeta?.providerName)
            const provider = providerMeta ? this.#providerManager.getProvider(providerMeta?.name) : undefined
            if (modelMeta && providerMeta && provider) {
              this.#ctx.setProvider(newCtxId, provider)
              this.#ctx.setModelMeta(newCtxId, modelMeta)
              this.#ctx.setProviderMeta(newCtxId, providerMeta)
              reqInfo.push({ message: msg, contextId: newCtxId })
            } else {
              this.#ctx.remove(newCtxId)
            }
          }
        })
        const dispatcher = this.#getDispatcher(reqInfo)
        await Promise.all(dispatcher)
        return reqInfo.map(i => i.contextId)
      } else {
        // all responding msgs were deleted, create new messages
        const modelMetas = (await storage.model.bulkGet(topic.modelIds)).filter(meta => !isUndefined(meta))
        const reqInfo = await this.#createResponseMessages(topicId, currentMsg.id, modelMetas)
        await this.getStorage().insertNewMessages(
          currentMsg,
          reqInfo.map(i => i.message)
        )
        const dispatcher = this.#getDispatcher(reqInfo)
        await Promise.all(dispatcher)
        return reqInfo.map(i => i.contextId)
      }
    } else {
      const modelMeta = await storage.model.get(currentMsg.modelId)
      const providerMeta = modelMeta ? await storage.provider.get(modelMeta.providerName) : undefined
      const provider = providerMeta ? this.#providerManager.getProvider(providerMeta.name) : undefined
      if (!(modelMeta && providerMeta && provider)) return []
      let ctx = this.#ctx.findByTopic(topicId, messageId)
      if (ctx) {
        ctx.handler?.terminate()
      } else {
        ctx = this.#ctx.get(this.#ctx.create(topicId, messageId))!
      }
      this.#ctx.setModelMeta(ctx.id, modelMeta)
      this.#ctx.setProviderMeta(ctx.id, providerMeta)
      this.#ctx.setProvider(ctx.id, provider)
      this.#emitMessage(currentMsg)
      await Promise.all(
        this.#getDispatcher([
          {
            message: currentMsg,
            contextId: ctx.id,
          },
        ])
      )
      return [ctx.id]
    }
  }
  /**
   * @param destroy true to destroy the context and will create new one next time
   */
  terminate(topicId: string, messageId: string, destroy?: boolean) {
    const ctx = this.#ctx.findByTopic(topicId, messageId)
    if (ctx) {
      ctx.handler?.terminate()
      destroy && this.#ctx.remove(ctx.id)
    }
  }
  /**
   * @param destroy true to destroy the context and will create new one next time
   */
  terminateAll(topicId: string, destroy?: boolean) {
    const ctx = this.#ctx.findAllByTopic(topicId)
    if (isArrayLength(ctx)) {
      ctx.forEach(c => this.terminate(topicId, c.messageId, destroy))
    }
  }
  /**
   * generate a title for the topic according to the topic's messages
   */
  async summarize(contextId: string) {
    const ctx = this.#ctx.get(contextId)
    if (!ctx) return
    const { modelMeta, providerMeta, provider, topicId } = ctx
    if (!(modelMeta && providerMeta && provider)) {
      console.warn("[summarize] stopped while lack of necessary info")
      return
    }
    const topic = await storage.chat.getTopic(topicId)
    if (!topic) return
    const messages = await storage.chat.getChatMessages(topicId)
    const contexts = getMessageContexts(topic, messages)
    if (!contexts.length) return
    provider.summarize(JSON.stringify(contexts), modelMeta, providerMeta, value => {
      if (isString(value.data.content)) {
        topic.label = value.data.content
        storage.chat.putChatTopic(topic)
        this.#ev.emit("topic", { data: topic })
      }
    })
  }
}
