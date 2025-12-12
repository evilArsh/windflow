import { uniqueId } from "@toolmain/shared"
import { ChatContextManager, ChatContext, Provider, RequestHandler } from "@windflow/core/types"

class ChatContextImpl implements ChatContextManager {
  #ctx: ChatContext[]
  constructor() {
    this.#ctx = []
  }
  #findByTopicMessageId(topicId: string, messageId: string) {
    return this.#ctx.find(ctx => ctx.topicId === topicId && ctx.messageId === messageId)
  }
  #getIndex(contextId: string) {
    return this.#ctx.findIndex(ctx => ctx.id === contextId)
  }
  create(topicId: string, messageId: string) {
    const exist = this.#findByTopicMessageId(topicId, messageId)
    if (exist) return exist
    const ctx: ChatContext = {
      id: uniqueId(),
      topicId,
      messageId,
    }
    this.#ctx.push(ctx)
    return { ...ctx }
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
    ctx.handler?.terminate()
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
}

export function createChatContext(): ChatContextManager {
  return new ChatContextImpl()
}
