import { cloneDeep, uniqueId } from "@toolmain/shared"
import {
  ChatContextManager,
  ChatContext,
  Provider,
  RequestHandler,
  ModelMeta,
  ProviderMeta,
} from "@windflow/core/types"

class ChatContextImpl implements ChatContextManager {
  #ctx: ChatContext[]
  constructor() {
    this.#ctx = []
  }
  #findByTopicMessageId(topicId: string, messageId: string) {
    return this.#ctx.find(ctx => ctx.topicId === topicId && ctx.messageId === messageId)
  }
  #findAllByTopic(topicId: string) {
    return this.#ctx.filter(ctx => ctx.topicId === topicId)
  }
  #getIndex(contextId: string) {
    return this.#ctx.findIndex(ctx => ctx.id === contextId)
  }
  create(topicId: string, messageId: string) {
    const exist = this.#findByTopicMessageId(topicId, messageId)
    if (exist) return exist.id
    const ctx: ChatContext = {
      id: uniqueId(),
      topicId,
      messageId,
    }
    this.#ctx.push(ctx)
    return ctx.id
  }
  findByTopic(topicId: string, messageId: string): ChatContext | undefined {
    return this.#findByTopicMessageId(topicId, messageId)
  }
  findAllByTopic(topicId: string): ChatContext[] | undefined {
    return this.#findAllByTopic(topicId)
  }
  has(contextId: string) {
    return this.#ctx.findIndex(ctx => ctx.id === contextId) > -1
  }
  get(contextId: string): ChatContext | undefined {
    return this.#ctx.find(ctx => ctx.id === contextId)
  }
  remove(contextId: string) {
    const ctx = this.get(contextId)
    if (!ctx) return false
    const index = this.#getIndex(contextId)
    this.#ctx.splice(index, 1)
    return true
  }
  setProvider(contextId: string, provider: Provider): boolean {
    const ctx = this.get(contextId)
    if (ctx) {
      ctx.provider = provider
      return true
    }
    return false
  }
  setHandler(contextId: string, handler: RequestHandler): boolean {
    const ctx = this.get(contextId)
    if (ctx) {
      ctx.handler = handler
      return true
    }
    return false
  }
  setModelMeta(contextId: string, modelMeta: ModelMeta): boolean {
    const ctx = this.get(contextId)
    if (ctx) {
      ctx.modelMeta = cloneDeep(modelMeta)
      return true
    }
    return false
  }
  setProviderMeta(contextId: string, providerMeta: ProviderMeta): boolean {
    const ctx = this.get(contextId)
    if (ctx) {
      ctx.providerMeta = cloneDeep(providerMeta)
      return true
    }
    return false
  }
}

export function createChatContext(): ChatContextManager {
  return new ChatContextImpl()
}
